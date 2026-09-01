/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — تعاملات و انیمیشن‌ها (GSAP + Vanilla)
   منو · Reveal اسکرول · شمارنده‌ها · لایت‌باکس · فرم واتساپ
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── ابزار کوچک ── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const faNum = (n) => Number(n).toLocaleString('fa-IR');

/* شماره واتساپ (در نسخه نهایی جایگزین شود) */
const WHATSAPP = '989123456789';

/* ═══════════ ۱) هدر و منوی موبایل ═══════════ */
const header = $('#siteHeader');
const onScrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

const hamburger = $('#hamburger');
const drawer = $('#mobileDrawer');
const backdrop = $('#drawerBackdrop');

function toggleDrawer(open) {
  const isOpen = open ?? !drawer.classList.contains('open');
  drawer.classList.toggle('open', isOpen);
  hamburger.classList.toggle('open', isOpen);
  backdrop.classList.toggle('show', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  drawer.setAttribute('aria-hidden', String(!isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
hamburger.addEventListener('click', () => toggleDrawer());
backdrop.addEventListener('click', () => toggleDrawer(false));
$$('.drawer-nav a, .drawer-cta').forEach(a => a.addEventListener('click', () => toggleDrawer(false)));

/* ═══════════ ۲) انیمیشن‌های GSAP ═══════════ */
const hasGSAP = typeof gsap !== 'undefined';
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

/* ورود سینمایی هیرو (پس از لود فونت/صحنه) */
function heroEntrance() {
  if (!hasGSAP) {
    $$('[data-hero]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('[data-hero]', {
    opacity: 1, y: 0, duration: 1.1, stagger: 0.14, delay: 0.25,
    onComplete: () => $$('[data-hero]').forEach(el => {
      el.style.transform = 'none'; // جلوگیری از تداخل با transform بعدی
    })
  });
  gsap.to('.scroll-hint', {
    opacity: 0,
    scrollTrigger: { trigger: '#home', start: '8% top', end: '22% top', scrub: true }
  });
}
if (document.readyState === 'complete') heroEntrance();
else window.addEventListener('load', heroEntrance);

/* Reveal نرم بخش‌ها با اسکرول */
if (hasGSAP) {
  $$('[data-reveal]').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      onComplete: () => { el.style.transform = 'none'; }
    });
  });

  /* استاگر ظریف کارت‌ها */
  [['.services-grid .card', 0.09], ['.products-grid .card', 0.07], ['.stats-grid .stat', 0.09], ['.portfolio-grid .portfolio-item', 0.08]]
    .forEach(([sel, st]) => {
      const items = $$(sel);
      if (!items.length) return;
      gsap.fromTo(items, { scale: 0.96 }, {
        scale: 1, duration: 0.9, ease: 'power2.out', stagger: st,
        scrollTrigger: { trigger: items[0].parentElement, start: 'top 82%', once: true }
      });
    });
} else {
  /* بدون GSAP همه‌چیز نمایان بماند */
  $$('[data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
}

/* ═══════════ ۳) اتصال صحنه‌های سه‌بعدی ═══════════ */
function bind3D() {
  const hero3d = window.Linenory3D && window.Linenory3D.hero;
  const sim = window.Linenory3D && window.Linenory3D.sim;

  /* حرکت دوربین هیرو با اسکرول */
  if (hero3d && hasGSAP) {
    ScrollTrigger.create({
      trigger: '#home', start: 'top top', end: 'bottom top', scrub: 0.6,
      onUpdate: self => hero3d.setProgress(self.progress)
    });
  } else if (hero3d) {
    window.addEventListener('scroll', () => {
      const max = window.innerHeight;
      hero3d.setProgress(Math.min(window.scrollY / max, 1));
    }, { passive: true });
  }

  /* شبیه‌ساز: دکمه‌های دمای رنگ */
  if (sim) {
    const kelvinValue = $('#kelvinValue');
    const kelvinName = $('#kelvinName');
    const readout = $('.sim-readout b');

    const glowByMode = {
      '6500': { c: 'rgba(220,236,255,.55)', n: 'rgba(220,236,255,.25)' },
      '4500': { c: 'rgba(255,242,217,.55)', n: 'rgba(255,242,217,.25)' },
      '3000': { c: 'rgba(255,191,102,.6)',  n: 'rgba(255,191,102,.3)' },
      'rgb':  { c: 'rgba(0,212,255,.55)',   n: 'rgba(139,92,246,.3)' }
    };

    $$('.sim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.sim-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        sim.setColor(mode);
        kelvinValue.textContent = btn.dataset.k;
        kelvinName.textContent = btn.dataset.name;
        const g = glowByMode[mode];
        kelvinValue.style.color = { '6500': '#dcecff', '4500': '#fff2d9', '3000': '#ffbf66', 'rgb': '#8fd9ff' }[mode];
        readout.style.textShadow = `0 0 22px ${g.c}`;
      });
    });

    /* اسلایدر شدت نور */
    const slider = $('#brightness');
    const out = $('#brightnessValue');
    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      sim.setBrightness(v / 100);
      out.textContent = faNum(v) + '٪';
    });
  }
}
/* منتظر آماده شدن ماژول Three.js */
if (window.Linenory3D && window.Linenory3D.hero) bind3D();
else document.addEventListener('linenory:3d-ready', bind3D, { once: true });

/* ═══════════ ۴) شمارنده‌های متحرک ═══════════ */
const counters = $$('.counter');
const runCounter = (el) => {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const dur = 1900;
  const t0 = performance.now();

  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = prefix + faNum(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      runCounter(e.target);
      counterIO.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterIO.observe(c));

/* ═══════════ ۵) لایت‌باکس گالری ═══════════ */
const lightbox = $('#lightbox');
const lbImg = $('.lightbox img');
const lbCap = $('.lb-caption');
const items = $$('.portfolio-item');
let lbIndex = 0;

function openLB(i) {
  lbIndex = (i + items.length) % items.length;
  const img = $('img', items[lbIndex]);
  const cap = $('figcaption', items[lbIndex]);
  lbImg.src = img.src.replace('w=900', 'w=1600'); // نسخه بزرگ‌تر
  lbImg.alt = img.alt;
  lbCap.textContent = cap ? cap.textContent : '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLB() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

items.forEach((it, i) => it.addEventListener('click', () => openLB(i)));
$('.lb-close').addEventListener('click', closeLB);
$('.lb-prev').addEventListener('click', e => { e.stopPropagation(); openLB(lbIndex - 1); });
$('.lb-next').addEventListener('click', e => { e.stopPropagation(); openLB(lbIndex + 1); });
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLB(); });
window.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLB();
  if (e.key === 'ArrowLeft') openLB(lbIndex + 1);   // RTL: چپ = بعدی
  if (e.key === 'ArrowRight') openLB(lbIndex - 1);
});

/* ═══════════ ۶) دکمه‌های استعلام قیمت → واتساپ ═══════════ */
$$('[data-product]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const msg = `سلام 👋\nبرای «${btn.dataset.product}» استعلام قیمت می‌خوام.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  });
});

/* ═══════════ ۷) فرم مشاوره → واتساپ ═══════════ */
$('#consultForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#fName').value.trim();
  const phone = $('#fPhone').value.trim();
  const desc = $('#fDesc').value.trim();

  if (!name || !phone) {
    (name ? $('#fPhone') : $('#fName')).focus();
    return;
  }

  const msg = `سلام 👋 درخواست مشاوره رایگان\n\n👤 نام: ${name}\n📞 شماره: ${phone}\n📝 توضیح پروژه: ${desc || '—'}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
});

/* ═══════════ ۸) لوگو تایپ‌رایتر کوچک در کنسول 😎 ═══════════ */
console.log('%c✦ لاین نوری استار — Linenory-Star\nنور، امضای فضای شما.',
  'background:#0a0a12;color:#FFB800;font-size:14px;padding:10px 16px;border-radius:8px;border:1px solid #00D4FF');
