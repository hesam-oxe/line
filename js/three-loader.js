/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — بارگذار تنبل Three.js (~۱٫۳MB وندور)
   بودجه عملکرد: three chunk < 700KB lazy (فعلی ۱٫۳MB — TODO: درخت‌تکانی/فشرده‌سازی)
   استراتژی: بعد از idle + دیده‌شدن هیرو؛ با reduced-motion فقط سیم.
   CSP-safe: import داینامیک هم‌مبدا (script-src 'self').
   ═══════════════════════════════════════════════════════════ */
'use strict';

(function () {
  var started = false;
  function start() {
    if (started) return;
    started = true;
    import('./three-scene.js').catch(function (err) {
      console.warn('3D lazy-load failed:', err);
      ['heroCanvas', 'simCanvas', 'studioCanvas'].forEach(function (id) {
        var c = document.getElementById(id);
        if (c) c.style.display = 'none';
      });
    });
  }

  var hero = document.getElementById('heroCanvas');
  var reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}

  function onIdle(fn) {
    if ('requestIdleCallback' in window && !reduced) {
      requestIdleCallback(fn, { timeout: 2500 });
    } else {
      setTimeout(fn, reduced ? 400 : 1200);
    }
  }

  if (!hero) {
    onIdle(start);
    return;
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        io.disconnect();
        onIdle(start);
      }
    }, { rootMargin: '400px' });
    io.observe(hero);
    setTimeout(start, 6000); // سقف انتظار
  } else {
    onIdle(start);
  }
})();
