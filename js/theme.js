/* لاین نوری استار — تم روشن/تیره (بدون FOUC + سیم‌کشی دکمه‌ها) */
(function () {
  function current() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('lns:theme', theme); } catch (_) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f6fb' : '#0a0a12');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      b.setAttribute('aria-label', theme === 'light' ? 'تغییر به تم تیره' : 'تغییر به تم روشن');
    });
  }
  try {
    var saved = localStorage.getItem('lns:theme');
    var theme = saved === 'light' || saved === 'dark' ? saved
      : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'dark';
  }
  function wire() {
    apply(current());
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      if (b.dataset.wired) return;
      b.dataset.wired = '1';
      b.addEventListener('click', function () {
        apply(current() === 'light' ? 'dark' : 'light');
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
  try {
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      try {
        if (!localStorage.getItem('lns:theme')) apply(e.matches ? 'light' : 'dark');
      } catch (_) {}
    });
  } catch (_) {}
})();
