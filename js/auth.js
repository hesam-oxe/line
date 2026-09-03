/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — منطق صفحه ورود / ثبت‌نام
   ═══════════════════════════════════════════════════════════ */
'use strict';

(async function () {

  await LNS.ready();
  const $ = (s) => document.querySelector(s);
  const { toast } = UI;

  /* اگر از قبل وارد شده — برو به پنل */
  const existing = LNS.me();
  if (existing) {
    location.replace(existing.role === 'admin' ? 'admin.html' : 'dashboard.html');
    return;
  }

  const next = new URLSearchParams(location.search).get('next') || '';
  const safeNext = /^[\w.-]+\.html$/.test(next) ? next : '';   /* فقط فایل‌های محلی مجاز */

  /* ── تب‌ها ────────────────────────────────────────────── */
  const tabLogin = $('#tabLogin'), tabReg = $('#tabReg'),
        loginForm = $('#loginForm'), regForm = $('#regForm');

  function showTab(isLogin) {
    tabLogin.classList.toggle('on', isLogin);
    tabReg.classList.toggle('on', !isLogin);
    tabLogin.setAttribute('aria-selected', isLogin);
    tabReg.setAttribute('aria-selected', !isLogin);
    loginForm.hidden = !isLogin;
    regForm.hidden = isLogin;
  }
  tabLogin.addEventListener('click', () => showTab(true));
  tabReg.addEventListener('click', () => showTab(false));
  if (location.hash === '#register') showTab(false);

  /* ── خطای فیلد ────────────────────────────────────────── */
  function err(input, msg) {
    const wrap = input.closest('.p-field');
    const el = wrap ? wrap.querySelector('.field-error') : null;
    if (el) el.textContent = msg || '';
    input.classList.toggle('invalid', Boolean(msg));
    if (msg) input.focus();
  }

  const busy = (btn, on) => {
    btn.disabled = on;
    btn.style.opacity = on ? '.6' : '';
    btn.textContent = on ? 'لطفاً صبر کنید…' : btn.dataset.label;
  };
  $('#loginBtn').dataset.label = 'ورود به پنل';
  $('#regBtn').dataset.label = 'ساخت حساب کاربری';

  /* ── ورود ─────────────────────────────────────────────── */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ident = $('#lIdent'), pass = $('#lPass');
    let bad = false;
    if (!ident.value.trim()) { err(ident, 'ایمیل یا شماره موبایل را وارد کنید.'); bad = true; } else err(ident);
    if (!pass.value) { err(pass, 'گذرواژه را وارد کنید.'); bad = true; } else err(pass);
    if (bad) return;

    const btn = $('#loginBtn');
    busy(btn, true);
    const res = await LNS.login(ident.value, pass.value);
    busy(btn, false);
    if (!res.ok) { toast(res.error, 'err'); err(pass, ' '); return; }

    toast('خوش آمدید ' + res.user.name + ' 👋', 'ok');
    setTimeout(() => {
      if (safeNext) location.href = safeNext;
      else location.href = res.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
    }, 650);
  });

  /* ── سنجش قوت گذرواژه ─────────────────────────────────── */
  const meter = $('#meter');
  $('#rPass').addEventListener('input', (e) => {
    const v = e.target.value;
    let s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[a-zA-Z]/.test(v) && /\d/.test(v)) s++;
    if (/[^a-zA-Z0-9]/.test(v)) s++;
    meter.style.width = (s * 25) + '%';
    meter.style.background = s <= 1 ? '#F87171' : s === 2 ? '#FFB800' : 'linear-gradient(90deg,#4ADE80,var(--cyan))';
  });

  /* ── ثبت‌نام ──────────────────────────────────────────── */
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#rName'), phone = $('#rPhone'), email = $('#rEmail'),
          pass = $('#rPass'), pass2 = $('#rPass2');
    let bad = false;
    if (name.value.trim().length < 3) { err(name, 'نام را کامل وارد کنید.'); bad = true; } else err(name);
    if (!LNS.isPhone(phone.value)) { err(phone, 'شماره موبایل معتبر نیست (۰۹…).'); bad = true; } else err(phone);
    if (!LNS.isEmail(email.value)) { err(email, 'ایمیل معتبر نیست.'); bad = true; } else err(email);
    if (!pass.value) { err(pass, 'گذرواژه را وارد کنید.'); bad = true; } else err(pass);
    if (pass.value !== pass2.value) { err(pass2, 'تکرار گذرواژه مطابقت ندارد.'); bad = true; } else err(pass2);
    if (bad) return;

    const btn = $('#regBtn');
    busy(btn, true);
    const res = await LNS.register({
      name: name.value, phone: phone.value, email: email.value,
      pass: pass.value, pass2: pass2.value
    });
    busy(btn, false);
    if (!res.ok) { toast(res.error, 'err'); return; }

    toast('حساب شما ساخته شد! خوش آمدید 🎉', 'ok');
    setTimeout(() => {
      if (safeNext) location.href = safeNext;
      else location.href = 'dashboard.html';
    }, 750);
  });
})();
