/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — لایه دیتا و احراز هویت (سمت کلاینت)
   معماری: SharedPreferences مبتنی بر localStorage با آماده‌سازی
   برای مهاجرت آینده به بک‌اند (Supabase/Firebase/REST)
   امنیت: هش SHA-256 نمک‌دار (WebCrypto) · قفل‌شدگی تلاش · نشست توکنی
   ═══════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const V = 1;                                    /* نسخه اسکیما — برای seed مجدد خودکار */
  const K = {
    users:    'lns:v' + V + ':users',
    session:  'lns:v' + V + ':session',
    products: 'lns:v' + V + ':products',
    quotes:   'lns:v' + V + ':quotes',
    msgs:     'lns:v' + V + ':msgs',
    favs:     'lns:v' + V + ':favs',
    settings: 'lns:v' + V + ':settings',
    guard:    'lns:v' + V + ':guard',
    meta:     'lns:v' + V + ':meta'
  };

  /* ── ابزارهای پایه ─────────────────────────────────────── */

  const uid = () =>
    (crypto.randomUUID ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  };

  const write = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (_) { return false; }
  };

  /* تبدیل ارقام فارسی/عربی → لاتین */
  const toEn = (s) => String(s == null ? '' : s)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  const normPhone = (p) => toEn(p).replace(/[\s\-()]/g, '').replace(/^\+98/, '0').replace(/^98(?=9)/, '0');
  const isPhone = (p) => /^09\d{9}$/.test(normPhone(p));
  const isEmail = (e) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(e || '').trim());
  const normMail = (e) => String(e || '').trim().toLowerCase();

  /* سانیتایز متن آزاد (دفاع لایه دوم در برابر XSS) */
  const clean = (s, max) => String(s == null ? '' : s)
    .replace(/[<>`\\{}$]/g, '').replace(/\s+/g, ' ').trim().slice(0, max || 300);

  const cleanMulti = (s, max) => String(s == null ? '' : s)
    .replace(/[<>`\\{}$]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max || 1000);

  /* هش گذرواژه — SHA-256(نمک::گذرواژه) */
  async function hashPass(pass, salt) {
    if (!crypto.subtle) throw new Error('SECURE_CONTEXT_REQUIRED');
    const data = new TextEncoder().encode(salt + '::' + pass);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const randToken = () => {
    const a = new Uint8Array(24);
    crypto.getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
  };

  const passProblems = (p) => {
    const s = String(p || '');
    if (s.length < 8) return 'گذرواژه باید حداقل ۸ کاراکتر باشد.';
    if (!/[a-zA-Z]/.test(s) || !/\d/.test(s)) return 'گذرواژه باید شامل حرف و عدد باشد.';
    return null;
  };

  /* ── داده‌های اولیه ────────────────────────────────────── */

  const CATS = {
    mono:    'تک‌رنگ',
    rgb:     'RGB',
    rgbw:    'RGBW',
    cob:     'COB و نئون فلکس',
    profile: 'پروفیل آلومینیومی',
    driver:  'درایور و کنترلر'
  };

  const SEED_PRODUCTS = [
    { name: 'لاین نوری ۲۲۰ولت تک‌رنگ ۶۴LED', cat: 'mono',    price: 185000, oldPrice: 230000, watt: '8W/m',  ip: 'IP65', volt: '220V', colors: ['#FFC966', '#FFFFFF', '#FFF3D6'], warranty: 18, stock: 140, badge: 'پرفروش',      featured: true,  glow: '#FFC966', desc: 'لاین نوری استاندارد ۲۲۰ولت با ۶۴ دیود در متر — مناسب نور مخفی سقف کاذب، روسری و لبه‌سازی. فلاس ضدآب و آهن‌ربایی قابل برش هر متر.' },
    { name: 'لاین نوری ۱۲ولت ۲۸۳۵ مخفی',     cat: 'mono',    price: 128000, oldPrice: 0,      watt: '7.2W/m', ip: 'IP20', volt: '12V',  colors: ['#FFFFFF', '#EAF2FF'],           warranty: 12, stock: 220, badge: '',            featured: true,  glow: '#F2F7FF', desc: 'لاین نوری ۱۲ولت دیود ۲۸۳۵ — نور یکنواخت برای کابینت و قفسه با درایور امن. انعطاف بالا و تاب گرم پایین.' },
    { name: 'لاین نوری کابینت با حسگر حرکت',  cat: 'mono',    price: 480000, oldPrice: 540000, watt: '6W/m',  ip: 'IP20', volt: '12V',  colors: ['#FFE8C2'],                      warranty: 18, stock: 65,  badge: 'پیشنهاد ویژه', featured: true,  glow: '#FFE8C2', desc: 'روشن‌شدن خودکار با باز‌شدن درب کابینت — حسگر حرکت و نور محیط، تاخیر خاموشی ۱۵ ثانیه، شارژ‌پذیر بدون نیاز به سیم‌کشی.' },
    { name: 'لاین نوری RGB کنترل‌دار',        cat: 'rgb',     price: 345000, oldPrice: 0,      watt: '9W/m',  ip: 'IP65', volt: '12V',  colors: ['#FF4D4D', '#4DFF88', '#4D9FFF', '#FFD24D'], warranty: 18, stock: 98, badge: 'پرفروش', featured: true, glow: '#7C5CFF', desc: '۱۶ میلیون رنگ با ریموت لمسی — ۲۰ حالت موج و تدریج، حافظه رنگ آخر، مناسب اتاق و فضای مجلسی.' },
    { name: 'لاین نوری آدرس‌پذیر WS2811',     cat: 'rgb',     price: 890000, oldPrice: 1050000, watt: '12W/m', ip: 'IP65', volt: '12V', colors: ['#FF3D7F', '#3DFFC8', '#3D7FFF'], warranty: 18, stock: 40, badge: 'حرفه‌ای', featured: true, glow: '#FF3D7F', desc: 'کنترل مستقل هر سگمنت رنگ — افکت باران، موج و موزیک با کنترلر بلوتوث. انتخاب اول نمای ساختمان و گیم‌روم.' },
    { name: 'لاین نوری RGBW چهارموتوره',      cat: 'rgbw',    price: 590000, oldPrice: 690000, watt: '14W/m', ip: 'IP65', volt: '24V', colors: ['#FFFFFF', '#FF8AD8', '#8AD8FF', '#FFD28A'], warranty: 24, stock: 52, badge: 'پرفروش', featured: true, glow: '#C9A7FF', desc: 'کانال سفید مستقل در کنار RGB — هم نور گرم مطالعه، هم فضای رنگی جشن. با تکنولوژی Chip-on جهت نور یکدست‌تر.' },
    { name: 'لاین نوری COB یکدست ۳۸۴LED',     cat: 'cob',     price: 720000, oldPrice: 0,      watt: '10W/m', ip: 'IP20', volt: '24V', colors: ['#FFF6E0', '#FFFFFF'], warranty: 24, stock: 74, badge: 'حرفه‌ای', featured: true, glow: '#FFF6E0', desc: '۳۸۴ دیود در متر با تکنولوژی COB — خط نور پیوسته بدون نقطه، حتی با پروفیل شفاف. ایده‌آل طراحی‌های مینیمال.' },
    { name: 'نئون فلکس ۱۲ولت IP67',           cat: 'cob',     price: 640000, oldPrice: 780000, watt: '8W/m',  ip: 'IP67', volt: '12V', colors: ['#FF6FD8', '#6FD8FF', '#FFF'], warranty: 24, stock: 88, badge: 'ضدآب', featured: false, glow: '#6FD8FF', desc: 'روکش سیلیکونی یکپارچه ضد باران و گردوغبار — مناسب نما، حیاط و محیط‌های بیرونی. خم‌پذیری بالا بدون شکستگی نور.' },
    { name: 'پروفیل آلومینیومی مخفی ۲متری',   cat: 'profile', price: 195000, oldPrice: 0,      watt: '—',     ip: '—',    volt: '—',   colors: ['#FFF3D6'], warranty: 0, stock: 300, badge: '', featured: false, glow: '#FFF3D6', desc: 'پروفیل استاندارد با روکش اپال مخفی‌کننده دیود — دفع کامل حرارت، عمر بالای لاین، همراه روسری و پلیت نصب.' },
    { name: 'پروفیل گوشه‌ای کابینت',          cat: 'profile', price: 165000, oldPrice: 210000, watt: '—',     ip: '—',    volt: '—',   colors: ['#FFE8C2'], warranty: 0, stock: 260, badge: 'پیشنهاد ویژه', featured: false, glow: '#FFE8C2', desc: 'نصب زیر کابینت با زاویه ۴۵ درجه — پخش نور به سطح کار بدون خیرگی. قابل برش با اره آلومینیوم.' },
    { name: 'درایور سوئیچینگ ۱۲ولت ۱۵آمپر',   cat: 'driver',  price: 385000, oldPrice: 0,      watt: '180W',  ip: 'IP20', volt: '220→12V', colors: [], warranty: 24, stock: 120, badge: '', featured: false, glow: '#9AA3B8', desc: 'منبع تغذیه سوئیچینگ با حفاظت اتصال‌کوتاه و اضافه‌بار — خروجی پایدار برای تا ۱۵ متر لاین ۱۲ولت.' },
    { name: 'ریموت کنترل RGB لمسی + بلوتوث',  cat: 'driver',  price: 260000, oldPrice: 320000, watt: '—',     ip: '—',    volt: '12-24V', colors: [], warranty: 12, stock: 150, badge: 'جدید', featured: false, glow: '#8B5CF6', desc: 'چرخ رنگ لمسی، دی‌مر و زمان‌سنج — کنترل همزمان از ریموت و اپلیکیشن موبایل با بلوتوث.' }
  ];

  const SEED_SETTINGS = {
    phone: '09123456789',
    whatsapp: '989123456789',
    email: 'info@linenory-star.ir',
    address: 'تهران، خیابان ولیعصر، برج نور، طبقه ۱۲',
    instagram: '',
    updatedAt: 0
  };

  /* ── آماده‌سازی (seed) ─────────────────────────────────── */

  let _ready = null;
  function ready() {
    if (_ready) return _ready;
    _ready = (async () => {
      const meta = read(K.meta, null);
      if (meta && meta.v === V) return;

      if (!read(K.users, null) || !read(K.users, []).some(u => u.role === 'admin')) {
        const salt = randToken();
        const admin = {
          id: uid(), name: 'مدیریت لاین نوری', phone: '', email: 'admin@linenory-star.ir',
          salt, role: 'admin', status: 'active',
          passHash: await hashPass('Lns@1404', salt),
          createdAt: Date.now(), lastLogin: 0
        };
        write(K.users, [admin]);
      }
      if (!read(K.products, null)) {
        write(K.products, SEED_PRODUCTS.map(p => Object.assign({ id: uid(), createdAt: Date.now() }, p)));
      }
      if (!read(K.settings, null)) write(K.settings, SEED_SETTINGS);
      write(K.quotes, read(K.quotes, []));
      write(K.msgs, read(K.msgs, []));
      write(K.favs, read(K.favs, {}));
      write(K.guard, read(K.guard, {}));
      write(K.meta, { v: V, seededAt: Date.now() });
    })();
    return _ready;
  }

  /* ── قفل‌شدگی تلاش ورود ────────────────────────────────── */

  const MAX_TRIES = 5, LOCK_MS = 5 * 60 * 1000;

  function guardState(key) {
    const g = read(K.guard, {});
    const s = g[key];
    if (s && s.until && Date.now() < s.until) {
      return { locked: true, secs: Math.ceil((s.until - Date.now()) / 1000) };
    }
    return { locked: false, tries: s ? s.n : 0 };
  }

  function guardFail(key) {
    const g = read(K.guard, {});
    const s = g[key] || { n: 0, until: 0 };
    s.n += 1;
    if (s.n >= MAX_TRIES) { s.until = Date.now() + LOCK_MS; s.n = 0; }
    g[key] = s;
    write(K.guard, g);
    return MAX_TRIES - s.n;
  }

  const guardClear = (key) => {
    const g = read(K.guard, {});
    delete g[key];
    write(K.guard, g);
  };

  /* ── نشست ─────────────────────────────────────────────── */

  const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

  function me() {
    const s = read(K.session, null);
    if (!s || !s.uid || s.exp < Date.now()) return null;
    const u = read(K.users, []).find(x => x.id === s.uid);
    if (!u || u.status === 'blocked') { logout(); return null; }
    return publicUser(u);
  }

  function publicUser(u) {
    const { passHash, salt, ...rest } = u;
    return rest;
  }

  function logout() { try { localStorage.removeItem(K.session); } catch (_) {} }

  function startSession(user) {
    write(K.session, { uid: user.id, t: randToken(), exp: Date.now() + SESSION_MS });
    const users = read(K.users, []);
    const u = users.find(x => x.id === user.id);
    if (u) { u.lastLogin = Date.now(); write(K.users, users); }
  }

  /* ── API عمومی ────────────────────────────────────────── */

  const LNS = { CATS, ready, me, logout, uid, toEn, normPhone, normMail, isPhone, isEmail, clean, cleanMulti };

  /* ثبت‌نام */
  LNS.register = async function ({ name, phone, email, pass, pass2 }) {
    await ready();
    name = clean(name, 60);
    if (name.length < 3) return { ok: false, error: 'نام را کامل وارد کنید (حداقل ۳ حرف).' };
    phone = normPhone(phone);
    if (!isPhone(phone)) return { ok: false, error: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' };
    email = normMail(email);
    if (!isEmail(email)) return { ok: false, error: 'ایمیل معتبر نیست.' };
    if (pass !== pass2) return { ok: false, error: 'تکرار گذرواژه مطابقت ندارد.' };
    const prob = passProblems(pass);
    if (prob) return { ok: false, error: prob };

    const users = read(K.users, []);
    if (users.some(u => u.email === email)) return { ok: false, error: 'این ایمیل قبلاً ثبت شده است.' };
    if (users.some(u => u.phone === phone)) return { ok: false, error: 'این شماره موبایل قبلاً ثبت شده است.' };

    const salt = randToken();
    const user = {
      id: uid(), name, phone, email, salt,
      passHash: await hashPass(pass, salt),
      role: 'customer', status: 'active',
      createdAt: Date.now(), lastLogin: 0
    };
    users.push(user);
    write(K.users, users);
    startSession(user);
    return { ok: true, user: publicUser(user) };
  };

  /* ورود — با ایمیل یا شماره موبایل */
  LNS.login = async function (identifier, pass) {
    await ready();
    const idRaw = String(identifier || '').trim();
    const key = normMail(toEn(idRaw));
    const g = guardState(key);
    if (g.locked) {
      const m = Math.ceil(g.secs / 60);
      return { ok: false, error: 'به دلیل تلاش‌های ناموفق، حساب موقتاً قفل است. ' + m + ' دقیقه دیگر تلاش کنید.' };
    }
    const users = read(K.users, []);
    const user = users.find(u => u.email === key || normPhone(u.phone) === normPhone(idRaw));
    const fail = (msg) => {
      const left = guardFail(key);
      return { ok: false, error: msg + (left <= 2 ? ' (تلاش باقی‌مانده: ' + left + ')' : '') };
    };
    if (!user) return fail('ایمیل/شماره یا گذرواژه اشتباه است.');
    if (user.status === 'blocked') return fail('این حساب مسدود شده است. با پشتیبانی تماس بگیرید.');

    const h = await hashPass(String(pass || ''), user.salt);
    if (h !== user.passHash) return fail('ایمیل/شماره یا گذرواژه اشتباه است.');

    guardClear(key);
    startSession(user);
    return { ok: true, user: publicUser(user) };
  };

  /* نگهبان مسیرها */
  LNS.requireRole = function (role, nextPage) {
    const u = me();
    if (!u) { location.replace('auth.html?next=' + encodeURIComponent(nextPage || location.pathname.split('/').pop())); return null; }
    if (role && u.role !== role) { location.replace('auth.html?next=' + encodeURIComponent(nextPage || '')); return null; }
    return u;
  };

  /* ── محصولات ──────────────────────────────────────────── */

  LNS.products = () => read(K.products, []);
  LNS.product = (id) => read(K.products, []).find(p => p.id === id) || null;

  LNS.saveProduct = function (data) {
    const u = me();
    if (!u || u.role !== 'admin') return { ok: false, error: 'دسترسی فقط برای مدیر.' };
    const list = read(K.products, []);
    const p = {
      id: data.id || uid(),
      name: clean(data.name, 80),
      cat: CATS[data.cat] ? data.cat : 'mono',
      price: Math.max(0, parseInt(toEn(data.price), 10) || 0),
      oldPrice: Math.max(0, parseInt(toEn(data.oldPrice), 10) || 0),
      watt: clean(data.watt, 20) || '—',
      ip: clean(data.ip, 12) || '—',
      volt: clean(data.volt, 20) || '—',
      colors: Array.isArray(data.colors) ? data.colors.slice(0, 8).map(c => /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#FFC966') : [],
      warranty: Math.max(0, parseInt(toEn(data.warranty), 10) || 0),
      stock: Math.max(0, parseInt(toEn(data.stock), 10) || 0),
      badge: clean(data.badge, 20),
      featured: !!data.featured,
      glow: /^#[0-9a-fA-F]{3,8}$/.test(data.glow || '') ? data.glow : '#FFC966',
      desc: cleanMulti(data.desc, 500),
      createdAt: Date.now()
    };
    if (p.name.length < 3) return { ok: false, error: 'نام محصول باید حداقل ۳ حرف باشد.' };
    if (!p.price) return { ok: false, error: 'قیمت را وارد کنید.' };
    const i = list.findIndex(x => x.id === p.id);
    if (i >= 0) { p.createdAt = list[i].createdAt; list[i] = p; } else { list.unshift(p); }
    write(K.products, list);
    return { ok: true, product: p };
  };

  LNS.deleteProduct = function (id) {
    const u = me();
    if (!u || u.role !== 'admin') return { ok: false, error: 'دسترسی فقط برای مدیر.' };
    write(K.products, read(K.products, []).filter(p => p.id !== id));
    return { ok: true };
  };

  /* ── علاقه‌مندی‌ها ─────────────────────────────────────── */

  LNS.favs = (userId) => (read(K.favs, {})[userId] || []);
  LNS.toggleFav = function (userId, productId) {
    const all = read(K.favs, {});
    const list = all[userId] || [];
    const i = list.indexOf(productId);
    if (i >= 0) list.splice(i, 1); else list.push(productId);
    all[userId] = list;
    write(K.favs, all);
    return i < 0;
  };

  /* ── استعلام قیمت ─────────────────────────────────────── */

  LNS.createQuote = function ({ userId, items, note }) {
    const users = read(K.users, []);
    const u = users.find(x => x.id === userId) || LNS.me();
    if (!u) return { ok: false, error: 'برای ثبت استعلام ابتدا وارد حساب شوید.' };
    if (!Array.isArray(items) || !items.length) return { ok: false, error: 'سبد استعلام خالی است.' };
    const list = read(K.quotes, []);
    const q = {
      id: uid(), userId: u.id, userName: u.name, userPhone: u.phone,
      items: items.slice(0, 30).map(it => ({
        productId: String(it.productId || '').slice(0, 40),
        name: clean(it.name, 80), qty: Math.min(999, Math.max(1, parseInt(toEn(it.qty), 10) || 1))
      })),
      note: cleanMulti(note, 500),
      status: 'new', adminNote: '',
      createdAt: Date.now(), updatedAt: Date.now()
    };
    list.unshift(q);
    write(K.quotes, list);
    return { ok: true, quote: q };
  };

  const Q_STATUS = { new: 'جدید', review: 'در حال بررسی', invoice: 'پیش‌فاکتور صادر شد', done: 'تأیید و تکمیل', rejected: 'رد شد' };
  LNS.Q_STATUS = Q_STATUS;

  LNS.quotes = () => read(K.quotes, []);
  LNS.myQuotes = (userId) => read(K.quotes, []).filter(q => q.userId === userId);

  LNS.setQuoteStatus = function (id, status, adminNote) {
    const u = me();
    if (!u || u.role !== 'admin') return { ok: false, error: 'دسترسی فقط برای مدیر.' };
    if (!Q_STATUS[status]) return { ok: false, error: 'وضعیت نامعتبر.' };
    const list = read(K.quotes, []);
    const q = list.find(x => x.id === id);
    if (!q) return { ok: false, error: 'استعلام یافت نشد.' };
    q.status = status;
    q.adminNote = cleanMulti(adminNote, 400);
    q.updatedAt = Date.now();
    write(K.quotes, list);
    return { ok: true };
  };

  /* ── پیام‌ها (فرم مشاوره + صندوق) ─────────────────────── */

  LNS.saveMessage = function ({ name, contact, body, userId }) {
    const m = {
      id: uid(),
      userId: userId || '',
      name: clean(name, 60) || 'مهمان',
      contact: clean(contact, 60),
      body: cleanMulti(body, 600),
      reply: '', status: 'open',
      createdAt: Date.now(), repliedAt: 0
    };
    if (!m.body) return { ok: false, error: 'متن پیام خالی است.' };
    const list = read(K.msgs, []);
    list.unshift(m);
    write(K.msgs, list);
    return { ok: true, message: m };
  };

  LNS.messages = () => read(K.msgs, []);
  LNS.myMessages = (userId) => read(K.msgs, []).filter(m => m.userId === userId);

  LNS.replyMessage = function (id, reply) {
    const u = me();
    if (!u || u.role !== 'admin') return { ok: false, error: 'دسترسی فقط برای مدیر.' };
    const list = read(K.msgs, []);
    const m = list.find(x => x.id === id);
    if (!m) return { ok: false, error: 'پیام یافت نشد.' };
    m.reply = cleanMulti(reply, 600);
    if (m.reply) { m.status = 'answered'; m.repliedAt = Date.now(); }
    else { m.status = 'open'; m.repliedAt = 0; }
    write(K.msgs, list);
    return { ok: true };
  };

  /* ── مدیریت کاربران ───────────────────────────────────── */

  LNS.users = () => read(K.users, []).map(publicUser);

  LNS.setUserStatus = function (id, status) {
    const meU = me();
    if (!meU || meU.role !== 'admin') return { ok: false, error: 'دسترسی فقط برای مدیر.' };
    if (id === meU.id) return { ok: false, error: 'نمی‌توانید حساب خودتان را تغییر وضعیت دهید.' };
    const users = read(K.users, []);
    const t = users.find(x => x.id === id);
    if (!t) return { ok: false, error: 'کاربر یافت نشد.' };
    t.status = status === 'blocked' ? 'blocked' : 'active';
    write(K.users, users);
    return { ok: true };
  };

  LNS.setUserRole = function (id, role) {
    const meU = me();
    if (!meU || meU.role !== 'admin') return { ok: false, error: 'دسترسی فقط برای مدیر.' };
    if (id === meU.id) return { ok: false, error: 'تغییر نقش خودتان مجاز نیست.' };
    if (role !== 'admin' && role !== 'customer') return { ok: false, error: 'نقش نامعتبر.' };
    const users = read(K.users, []);
    const t = users.find(x => x.id === id);
    if (!t) return { ok: false, error: 'کاربر یافت نشد.' };
    t.role = role;
    write(K.users, users);
    return { ok: true };
  };

  /* پروفایل شخصی */
  LNS.updateProfile = function (id, { name, phone, email }) {
    const meU = me();
    if (!meU || meU.id !== id) return { ok: false, error: 'دسترسی مجاز نیست.' };
    name = clean(name, 60);
    if (name.length < 3) return { ok: false, error: 'نام را کامل وارد کنید.' };
    phone = normPhone(phone);
    if (!isPhone(phone)) return { ok: false, error: 'شماره موبایل معتبر نیست.' };
    email = normMail(email);
    if (!isEmail(email)) return { ok: false, error: 'ایمیل معتبر نیست.' };
    const users = read(K.users, []);
    if (users.some(x => x.email === email && x.id !== id)) return { ok: false, error: 'این ایمیل برای حساب دیگری ثبت شده.' };
    if (users.some(x => x.phone === phone && x.id !== id)) return { ok: false, error: 'این شماره برای حساب دیگری ثبت شده.' };
    const t = users.find(x => x.id === id);
    t.name = name; t.phone = phone; t.email = email;
    write(K.users, users);
    return { ok: true, user: publicUser(t) };
  };

  LNS.changePassword = async function (id, current, next) {
    const meU = me();
    if (!meU || meU.id !== id) return { ok: false, error: 'دسترسی مجاز نیست.' };
    const prob = passProblems(next);
    if (prob) return { ok: false, error: prob };
    const users = read(K.users, []);
    const t = users.find(x => x.id === id);
    const curHash = await hashPass(String(current || ''), t.salt);
    if (curHash !== t.passHash) return { ok: false, error: 'گذرواژه فعلی اشتباه است.' };
    if (String(next) === String(current)) return { ok: false, error: 'گذرواژه جدید باید متفاوت باشد.' };
    t.salt = randToken();
    t.passHash = await hashPass(next, t.salt);
    write(K.users, users);
    return { ok: true };
  };

  /* ── تنظیمات سایت (قابل ویرایش توسط ادمین) ────────────── */

  LNS.settings = () => Object.assign({}, SEED_SETTINGS, read(K.settings, {}));
  LNS.saveSettings = function (obj) {
    const u = me();
    if (!u || u.role !== 'admin') return { ok: false, error: 'دسترسی فقط برای مدیر.' };
    const s = LNS.settings();
    s.phone = normPhone(obj.phone || s.phone);
    s.whatsapp = normPhone(obj.whatsapp || s.whatsapp).replace(/^0/, '98');
    s.email = normMail(obj.email || s.email);
    s.address = cleanMulti(obj.address || s.address, 160);
    s.instagram = clean(obj.instagram || '', 80);
    s.updatedAt = Date.now();
    write(K.settings, s);
    return { ok: true, settings: s };
  };

  /* همگام‌سازی بین تب‌ها */
  LNS.onSync = function (fn) { window.addEventListener('storage', (e) => { if (e.key && e.key.indexOf('lns:v') === 0) fn(e.key); }); };

  window.LNS = LNS;
})();
