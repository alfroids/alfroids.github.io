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