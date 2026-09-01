/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — هسته تعاملی EXTREME
   پری‌لودر · کرسر سفارشی · منو · GSAP · شمارنده · لایت‌باکس
   فرم امن (Honeypot + Rate-limit + سانیتایز) · مگنت · تیلت
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── ابزارها ── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const faNum = (n) => Number(n).toLocaleString('fa-IR');

/* شماره واتساپ — در نسخه نهایی جایگزین شود */
const WHATSAPP = '989123456789';

/* محیط */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE    = matchMedia('(pointer: fine)').matches;

/* ═══════════ ۰) امنیت: ضد clickjacking (Frame-Bust) ═══════════ */
if (window.top !== window.self) {
  try { window.top.location = window.location; }
  catch (_) { document.documentElement.style.display = 'none'; }
}

/* ═══════════ ۱) سیستم توست ═══════════ */
function toast(msg, type = 'ok') {
  const stack = $('#toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'err'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5v5.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.15" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 12.4l2.7 2.7L16.4 9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  el.innerHTML = icon; // آیکون ثابت داخلی — بدون داده کاربر
  const span = document.createElement('span');
  span.textContent = msg; // متن امن
  el.appendChild(span);
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 450);
  }, 4200);
}

/* ═══════════ ۲) پری‌لودر سینمایی ═══════════ */
function runPreloader(onDone) {
  const pre = $('#preloader');
  const fill = $('#preFill');
  const pct = $('#prePct');
  if (!pre || REDUCED) { if (pre) pre.remove(); onDone(); return; }

  document.body.style.overflow = 'hidden'; // قفل اسکرول حین لود

  const DUR = 1350;
  const t0 = performance.now();
  let loaded = false;
  window.addEventListener('load', () => { loaded = true; }, { once: true });

  function tick(now) {
    const p = Math.min((now - t0) / DUR, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const v = Math.round(eased * 100);
    fill.style.width = v + '%';
    pct.textContent = faNum(v) + '٪';
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      /* صبر برای لود واقعی صفحه (حداکثر ۱.۲ ثانیه اضافه) */
      const wait = setInterval(() => {
        if (loaded) { clearInterval(wait); reveal(); }
      }, 90);
      setTimeout(() => { clearInterval(wait); reveal(); }, 1300);
    }
  }
  function reveal() {
    pre.classList.add('done');
    document.body.style.overflow = '';
    setTimeout(() => pre.remove(), 950);
    onDone();
  }
  requestAnimationFrame(tick);
}

/* ═══════════ ۳) ورود سینمایی هیرو ═══════════ */
const hasGSAP = typeof gsap !== 'undefined';
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

function heroEntrance() {
  if (!hasGSAP || REDUCED) {
    $$('[data-hero]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('[data-hero]', {
    opacity: 1, y: 0, duration: 1.1, stagger: 0.13, delay: 0.1,
    onComplete: () => $$('[data-hero]').forEach(el => { el.style.transform = 'none'; })
  });
  gsap.to('.scroll-hint', {
    opacity: 0,
    scrollTrigger: { trigger: '#home', start: '8% top', end: '22% top', scrub: true }
  });
}

runPreloader(heroEntrance);

/* ═══════════ ۴) هدر چسبان + منوی موبایل ═══════════ */
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

/* ═══════════ ۵) هایلایت لینک فعال منو ═══════════ */
const navLinks = $$('.main-nav a');
const sectionMap = new Map();
navLinks.forEach(a => {
  const id = a.getAttribute('href');
  const sec = id && id.startsWith('#') ? $(id) : null;
  if (sec) sectionMap.set(sec, a);
});
const navIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    const link = sectionMap.get(e.target);
    if (!link) return;
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}, { rootMargin: '-42% 0px -52% 0px' });
sectionMap.forEach((_, sec) => navIO.observe(sec));

/* ═══════════ ۶) Reveal نرم بخش‌ها با اسکرول ═══════════ */
if (hasGSAP && !REDUCED) {
  $$('[data-reveal]').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      onComplete: () => { el.style.transform = 'none'; }
    });
  });

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
  $$('[data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
}

/* ═══════════ ۷) کرسر سفارشی (فقط دسکتاپ) ═══════════ */
if (FINE && !REDUCED) {
  const dot = $('#cursorDot');
  const ring = $('#cursorRing');
  if (dot && ring) {
    document.body.classList.add('custom-cursor');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const dotP = { ...pos }, ringP = { ...pos };
    let seen = false;

    window.addEventListener('pointermove', (e) => {
      pos.x = e.clientX; pos.y = e.clientY;
      if (!seen) { seen = true; dotP.x = ringP.x = pos.x; dotP.y = ringP.y = pos.y; }
    }, { passive: true });

    document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = 1; });

    (function loop() {
      dotP.x += (pos.x - dotP.x) * 0.4;
      dotP.y += (pos.y - dotP.y) * 0.4;
      ringP.x += (pos.x - ringP.x) * 0.16;
      ringP.y += (pos.y - ringP.y) * 0.16;
      dot.style.transform = `translate(${dotP.x}px, ${dotP.y}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${ringP.x}px, ${ringP.y}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    /* بزرگ شدن حلقه روی عناصر تعاملی */
    const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(INTERACTIVE)) ring.classList.add('grow');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(INTERACTIVE)) ring.classList.remove('grow');
    });
  }
}

/* ═══════════ ۸) اتصال صحنه‌های سه‌بعدی ═══════════ */
function bind3D() {
  const hero3d = window.Linenory3D && window.Linenory3D.hero;
  const sim = window.Linenory3D && window.Linenory3D.sim;

  /* حرکت دوربین هیرو با اسکرول */
  if (hero3d && hasGSAP && !REDUCED) {
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
      '6500': { c: '#dcecff', s: 'rgba(220,236,255,.55)' },
      '4500': { c: '#fff2d9', s: 'rgba(255,242,217,.55)' },
      '3000': { c: '#ffbf66', s: 'rgba(255,191,102,.6)' },
      'rgb':  { c: '#8fd9ff', s: 'rgba(0,212,255,.55)' }
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
        kelvinValue.style.color = g.c;
        readout.style.textShadow = `0 0 22px ${g.s}`;
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

  /* استودیوی سه‌بعدی: تعویض فضا */
  const studio = window.Linenory3D && window.Linenory3D.studio;
  if (studio) {
    $$('.studio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.studio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        studio.setRoom(btn.dataset.room);
        toast(`فضای «${btn.dataset.name}» فعال شد — بکشید تا بچرخد.`, 'ok');
      });
    });
  }
}
if (window.Linenory3D && window.Linenory3D.hero) bind3D();
else document.addEventListener('linenory:3d-ready', bind3D, { once: true });

/* ═══════════ ۹) شمارنده‌های متحرک ═══════════ */
const runCounter = (el) => {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const dur = 1900;
  const t0 = performance.now();

  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
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
$$('.counter').forEach(c => counterIO.observe(c));

/* ═══════════ ۱۰) لایت‌باکس گالری ═══════════ */
const lightbox = $('#lightbox');
const lbImg = $('.lightbox img');
const lbCap = $('.lb-caption');
const items = $$('.portfolio-item');
let lbIndex = 0;
let lbReturnFocus = null;

function openLB(i) {
  lbIndex = (i + items.length) % items.length;
  const img = $('img', items[lbIndex]);
  const cap = $('figcaption', items[lbIndex]);
  lbImg.src = img.src.replace('w=900', 'w=1600');
  lbImg.alt = img.alt;
  lbCap.textContent = cap ? cap.textContent : '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('.lb-close').focus();
}
function closeLB() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lbReturnFocus) lbReturnFocus.focus();
}

items.forEach((it, i) => {
  it.addEventListener('click', () => { lbReturnFocus = it; openLB(i); });
  it.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      lbReturnFocus = it;
      openLB(i);
    }
  });
});
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

/* ═══════════ ۱۱) استعلام قیمت → پیش‌پر کردن فرم ═══════════ */
$$('[data-product]').forEach(btn => {
  btn.addEventListener('click', () => {
    const desc = $('#fDesc');
    if (desc) desc.value = `سلام، برای «${btn.dataset.product}» استعلام قیمت می‌خواهم.`;
    $('#contact').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    setTimeout(() => $('#fName') && $('#fName').focus({ preventScroll: true }), REDUCED ? 0 : 700);
    toast(`«${btn.dataset.product}» انتخاب شد — فرم را کامل کنید.`, 'ok');
  });
});

/* ═══════════ ۱۲) فرم مشاوره — سخت‌گیرانه و امن ═══════════ */
const form = $('#consultForm');
const RATE_LIMIT_MS = 30000;      /* حداکثر یک ارسال در ۳۰ ثانیه */
let lastSubmit = Number(sessionStorage.getItem('ln_last_submit') || 0);

/* تبدیل ارقام فارسی/عربی به لاتین + حذف نویز */
function normalizeDigits(s) {
  return s
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}
/* سانیتایز: حذف کاراکترهای خطرناک و محدودیت طول */
const sanitize = (s, max) => normalizeDigits(s).replace(/[<>"'`\\{}$;]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

function setFieldError(input, msg) {
  const wrap = input.closest('.field');
  const err = wrap ? wrap.querySelector('.field-error') : null;
  if (err) err.textContent = msg || '';
  input.classList.toggle('invalid', Boolean(msg));
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nameEl = $('#fName');
  const phoneEl = $('#fPhone');
  const descEl = $('#fDesc');
  const hp = $('#fWebsite');

  /* ── تله ربات‌ها: اگر پر شده باشد، ارسال جعلی موفق نشان می‌دهیم ── */
  if (hp && hp.value.trim() !== '') {
    form.reset();
    toast('درخواست شما ثبت شد.', 'ok');
    return;
  }

  /* ── محدودیت نرخ ارسال ── */
  const now = Date.now();
  if (now - lastSubmit < RATE_LIMIT_MS) {
    const wait = Math.ceil((RATE_LIMIT_MS - (now - lastSubmit)) / 1000);
    toast(`لطفاً ${faNum(wait)} ثانیه دیگر دوباره تلاش کنید.`, 'err');
    return;
  }

  /* ── اعتبارسنجی ── */
  const name = sanitize(nameEl.value, 80);
  const phoneRaw = normalizeDigits(phoneEl.value).replace(/[\s\-()]/g, '');
  const phone = phoneRaw.replace(/[^\d+]/g, '');
  const desc = sanitize(descEl.value, 500);

  let ok = true;
  if (name.length < 3) {
    setFieldError(nameEl, 'نام را کامل وارد کنید (حداقل ۳ حرف).');
    ok = false;
  } else setFieldError(nameEl, '');

  const phoneValid = /^(?:\+98|0098|0)?9\d{9}$/.test(phone);
  if (!phoneValid) {
    setFieldError(phoneEl, 'شماره موبایل معتبر نیست — مثل ۰۹۱۲۱۲۳۴۵۶۷.');
    ok = false;
  } else setFieldError(phoneEl, '');

  if (!ok) {
    form.classList.remove('form-shake');
    void form.offsetWidth; /* ری‌استارت انیمیشن */
    form.classList.add('form-shake');
    (name.length < 3 ? nameEl : phoneEl).focus();
    return;
  }

  /* ── ساخت پیام واتساپ (بدون کاراکتر خطرناک) ── */
  const msg =
    `سلام، درخواست مشاوره از وب‌سایت لاین نوری استار\n\n` +
    `نام: ${name}\n` +
    `شماره تماس: ${phone}\n` +
    `توضیح پروژه: ${desc || '—'}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');

  lastSubmit = now;
  sessionStorage.setItem('ln_last_submit', String(now));
  form.reset();
  setFieldError(nameEl, '');
  setFieldError(phoneEl, '');
  toast('درخواست شما در واتساپ آماده ارسال است.', 'ok');
});

/* پاک شدن خطا هنگام تایپ */
['#fName', '#fPhone'].forEach(sel => {
  const el = $(sel);
  el && el.addEventListener('input', () => setFieldError(el, ''));
});

/* ═══════════ ۱۳) دکمه‌های مغناطیسی ═══════════ */
if (FINE && !REDUCED && hasGSAP) {
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: x * 0.28, y: y * 0.28, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .4)' });
    });
  });
}

/* ═══════════ ۱۴) تیلت سه‌بعدی کارت‌ها ═══════════ */
if (FINE && !REDUCED && hasGSAP) {
  $$('.card-tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: px * 7, rotateX: -py * 7, scale: 1.015,
        transformPerspective: 750,
        duration: 0.5, ease: 'power2.out'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.7, ease: 'power3.out' });
    });
  });
}

/* ═══════════ ۱۵) بازگشت به بالا + حلقه پیشرفت ═══════════ */
const toTop = $('#toTop');
const toTopRing = $('#toTopRing');
const RING_LEN = 132;
let ticking = false;

function onScrollUI() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(y / max, 1) : 0;
  toTop.classList.toggle('show', y > 650);
  toTopRing.style.strokeDashoffset = String(RING_LEN * (1 - p));
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScrollUI); ticking = true; }
}, { passive: true });
onScrollUI();

toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
});

/* ═══════════ ۱۶) سوالات متداول — آکاردئون دسترس‌پذیر ═══════════ */
$$('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    /* فقط یک سوال باز بماند */
    $$('.faq-q').forEach(other => {
      if (other === btn) return;
      other.setAttribute('aria-expanded', 'false');
      other.closest('.faq-item').classList.remove('open');
      const p = document.getElementById(other.getAttribute('aria-controls'));
      if (p) p.hidden = true;
    });

    btn.setAttribute('aria-expanded', String(!isOpen));
    btn.closest('.faq-item').classList.toggle('open', !isOpen);
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.hidden = isOpen;
  });
});

/* ═══════════ ۱۷) امضای کنسول ═══════════ */
console.log('%c✦ لاین نوری استار — Linenory-Star EXTREME\nنور، امضای فضای شما.\n۳ صحنه سه‌بعدی · سئوی کامل · امنیت سطح خدا',
  'background:#0a0a12;color:#FFB800;font-size:14px;padding:10px 16px;border-radius:8px;border:1px solid #00D4FF');
