// Mobile nav burger toggle
(function () {
  const burger = document.getElementById('nav-burger');
  const links = document.getElementById('nav-links');

  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Terminal boot sequence — types itself out once per page load, then
// reveals the profile content. Click anywhere in the terminal, or a
// reduced-motion preference, skips straight to the finished state.
(function () {
  const body = document.getElementById('terminal-body');
  const log = document.getElementById('boot-log');
  const hint = document.getElementById('boot-hint');

  const lines = [
    { text: 'booting profile_os v1.0...', ok: false },
    { text: 'mounting /research ... [OK]', ok: true },
    { text: 'mounting /gamedev ... [OK]', ok: true },
    { text: 'decoding HLA-DRB1 locus: A-T-C-G-G-A-T-C-C-A-T-G', ok: false },
    { text: 'user identified: [Your Name]', ok: false },
    { text: 'welcome.', ok: false },
  ];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    log.innerHTML = lines
      .map((l) => (l.ok ? l.text.replace('[OK]', '<span class="ok">[OK]</span>') : l.text))
      .join('\n');
    body.classList.add('booted');
    body.removeEventListener('click', finish);
  }

  if (prefersReducedMotion) {
    finish();
    return;
  }

  body.addEventListener('click', finish);

  let lineIndex = 0;
  let charIndex = 0;
  let current = '';

  function typeStep() {
    if (finished) return;
    if (lineIndex >= lines.length) {
      finish();
      return;
    }
    const line = lines[lineIndex];
    if (charIndex <= line.text.length) {
      current = lines
        .slice(0, lineIndex)
        .map((l) => l.text)
        .concat(line.text.slice(0, charIndex))
        .join('\n');
      log.textContent = current;
      charIndex++;
      setTimeout(typeStep, 14);
    } else {
      lineIndex++;
      charIndex = 0;
      setTimeout(typeStep, 180);
    }
  }

  setTimeout(typeStep, 200);
})();