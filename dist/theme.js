(() => {
  const key = 'nashi-svoi-theme';
  const root = document.documentElement;
  let theme = 'light';
  try {
    if (localStorage.getItem(key) === 'dark') theme = 'dark';
  } catch (_) { /* The switch also works when browser storage is unavailable. */ }

  // This script runs before CSS so a saved dark theme never flashes light.
  root.dataset.theme = theme;

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('#theme-toggle');
    if (!toggle) return;
    function update() {
      const dark = theme === 'dark';
      root.dataset.theme = theme;
      toggle.setAttribute('aria-checked', String(dark));
      toggle.title = dark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему';
    }
    update();
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      update();
      try { localStorage.setItem(key, theme); } catch (_) { /* Optional preference. */ }
    });
  });
})();
