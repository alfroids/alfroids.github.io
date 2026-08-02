// Theme toggle (light/dark). Defaults to the visitor's system preference,
// then remembers their choice for future visits on this site.
(function () {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');

  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));

  toggleBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    // Let the drift simulation know so it can re-read accent colors.
    window.dispatchEvent(new CustomEvent('themechange'));
  });
})();

// Mobile nav burger toggle
(function () {
  const burger = document.getElementById('nav-burger');
  const links = document.getElementById('nav-links');

  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu after tapping a link (mobile)
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Scroll reveal: fade + lift elements in the first time they enter view.
(function () {
  const items = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Stagger cards within the same grid slightly so they don't all
  // land in lockstep, without needing to hand-author delays in HTML.
  const groups = new Map();
  items.forEach((el) => {
    const parent = el.parentElement;
    const siblingIndex = groups.has(parent) ? groups.get(parent) : 0;
    el.style.setProperty('--d', `${Math.min(siblingIndex, 4) * 0.08}s`);
    groups.set(parent, siblingIndex + 1);
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
})();

// Genetic drift background: a fixed population of coloured "alleles"
// arranged in a grid. Each tick, a small number of individuals are
// resampled from a random neighbour — copying its colour — which is
// exactly the mechanism of genetic drift: allele frequencies shift
// through random sampling alone, with no fitness difference between
// colours. Patches of colour grow, shrink, and occasionally fix or
// vanish, purely by chance.
(function () {
  const canvas = document.getElementById('drift-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPACING = 26;
  const DOT_RADIUS = 2.1;
  const JITTER_AMOUNT = 2.4;
  const DRIFT_FRACTION = 0.05; // share of the population resampled per tick
  const TICK_MS = 100;

  let cols = 0;
  let rows = 0;
  let alleles = []; // color index per cell
  let phases = [];  // per-cell phase offset for jitter
  let colors = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let rafId = null;
  let tickTimer = null;

  function readColors() {
    const styles = getComputedStyle(document.documentElement);
    colors = ['--moss', '--slate', '--ochre', '--plum'].map((v) => styles.getPropertyValue(v).trim());
  }

  function buildGrid() {
    const rect = hero.getBoundingClientRect();
    width = Math.ceil(rect.width);
    height = Math.ceil(rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(width / SPACING) + 1;
    rows = Math.ceil(height / SPACING) + 1;
    const total = cols * rows;

    alleles = new Array(total);
    phases = new Array(total);
    for (let i = 0; i < total; i++) {
      alleles[i] = Math.floor(Math.random() * colors.length);
      phases[i] = Math.random() * Math.PI * 2;
    }
  }

  function neighborIndex(i) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
    ];
    const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = Math.min(cols - 1, Math.max(0, x + dx));
    const ny = Math.min(rows - 1, Math.max(0, y + dy));
    return ny * cols + nx;
  }

  function drift() {
    const total = alleles.length;
    const samples = Math.max(1, Math.floor(total * DRIFT_FRACTION));
    for (let s = 0; s < samples; s++) {
      const i = Math.floor(Math.random() * total);
      const n = neighborIndex(i);
      alleles[i] = alleles[n];
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    const time = t || 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const phase = phases[i];
        const jx = prefersReducedMotion ? 0 : Math.sin(time * 0.0006 + phase) * JITTER_AMOUNT;
        const jy = prefersReducedMotion ? 0 : Math.cos(time * 0.0005 + phase) * JITTER_AMOUNT;
        ctx.beginPath();
        ctx.arc(x * SPACING + jx, y * SPACING + jy, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = colors[alleles[i]];
        ctx.globalAlpha = 0.38;
        ctx.fill();
      }
    }
  }

  function loop(t) {
    draw(t);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    readColors();
    buildGrid();

    if (prefersReducedMotion) {
      draw(0);
      return;
    }

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);

    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(drift, TICK_MS);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildGrid, 150);
  });

  window.addEventListener('themechange', () => {
    readColors();
  });

  start();
})();