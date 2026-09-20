/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — کلاینت API + نمای داده هیبریدی
   اول API، بعد کش localStorage (آفلاین). نوشتن‌های آفلاین در صف
   'lns:queue' ذخیره و با اتصال مجدد ارسال می‌شوند.
   شکل داده‌ها نرمال به فرمت UI (همان LNS) برمی‌گردد.
   ═══════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const cfg = (typeof window !== 'undefined' && window.LNS_CONFIG) || {};
  const API_BASE = (() => {
    const b = cfg.API && cfg.API.BASE;
    if (b) return String(b).replace(/\/$/, '');
    try {
      const h = location.hostname;
      if ((h === 'localhost' || h === '127.0.0.1') && location.port === '8000') {
        return 'http://localhost:8001';
      }
    } catch (_) {}
    return '/api';
  })();

  const CATS = {
    mono: 'تک‌رنگ', rgb: 'RGB', rgbw: 'RGBW',
    cob: 'COB و نئون فلکس', profile: 'پروفیل آلومینیومی', driver: 'درایور و کنترلر'
  };
  const Q_STATUS = { new: 'جدید', review: 'در حال بررسی', invoice: 'پیش‌فاکتور صادر شد', done: 'تأیید و تکمیل', rejected: 'رد شد' };

  let mode = 'api'; // 'api' | 'offline'
  const listeners = [];

  function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  async function req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const csrf = getCookie('lns_csrf');
    if (csrf && method !== 'GET') headers['X-CSRF-Token'] = csrf;
    let res;
    try {
      res = await fetch(API_BASE + path, {
        method, headers, credentials: 'include',
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (_) {
      setMode('offline');
      throw new Error('OFFLINE');
    }
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    if (res.status === 401) {
      const e = new Error((data && data.error) || 'ورود لازم است.');
      e.code = 401; e.data = data;
      throw e;
    }
    if (!res.ok) {
      const e = new Error((data && data.error) || ('خطای سرور (' + res.status + ')'));
      e.code = res.status; e.data = data;
      throw e;
    }
    setMode('api');
    return data || {};
  }

  function setMode(m) {
    if (mode !== m) {
      mode = m;
      listeners.forEach((fn) => { try { fn(m); } catch (_) {} });
    }
  }

  /* ── کش آفلاین ─────────────────────────────────────────── */
  const cache = {
    get(k, fb) {
      try {
        const raw = localStorage.getItem('lns:cache:' + k);
        if (!raw) return fb;
        const o = JSON.parse(raw);
        if (Date.now() - o.t > 5 * 60 * 1000) return fb; // ۵ دقیقه
        return o.v;
      } catch (_) { return fb; }
    },
    set(k, v) {
      try { localStorage.setItem('lns:cache:' + k, JSON.stringify({ t: Date.now(), v })); } catch (_) {}
    }
  };

  /* ── صف نوشتن آفلاین ───────────────────────────────────── */
  const queue = {
    all() {
      try { return JSON.parse(localStorage.getItem('lns:queue') || '[]'); } catch (_) { return []; }
    },
    push(op) {
      try {
        const q = queue.all();
        q.push(Object.assign({ t: Date.now() }, op));
        localStorage.setItem('lns:queue', JSON.stringify(q.slice(-50)));
      } catch (_) {}
    },
    async flush() {
      const q = queue.all();
      if (!q.length) return 0;
      let n = 0;
      const rest = [];
      for (const op of q) {
        try {
          await req('POST', op.path, op.body);
          n++;
        } catch (_) { rest.push(op); }
      }
      try { localStorage.setItem('lns:queue', JSON.stringify(rest)); } catch (_) {}
      return n;
    }
  };
  window.addEventListener('online', () => { queue.flush().catch(() => {}); });

  /* ── نرمال‌سازی به فرمت UI ─────────────────────────────── */
  function normProduct(p) {
    return {
      id: p.id, slug: p.slug || '',
      name: p.name || '',
      cat: p.category || p.cat || 'mono',
      price: Number(p.price || 0),
      oldPrice: Number(p.oldPrice || 0),
      watt: p.watt || '—', ip: p.ip || '—', volt: p.volt || '—',
      colors: Array.isArray(p.colors) ? p.colors : [],
      warranty: Number(p.warranty || 0),
      stock: Number(p.stock || 0),
      badge: p.badge || '', featured: !!p.featured,
      glow: p.glow || '#FFC966',
      desc: p.description || p.desc || '',
      createdAt: p.created_at || p.createdAt || Date.now()
    };
  }

  function normQuote(q, byProduct) {
    if (q.items) return q; // قبلاً فرمت UI
    const items = q.product_id
      ? [{ productId: q.product_id, name: (byProduct(q.product_id) || {}).name || 'محصول', qty: q.quantity || 1 }]
      : [];
    return {
      id: q.id, userId: q.user_id || q.userId || '',
      userName: q.userName || '', userPhone: q.userPhone || '',
      items, note: q.message || q.note || '',
      adminNote: q.adminNote || '',
      status: q.status || 'new',
      createdAt: q.created_at || q.createdAt || Date.now(),
      updatedAt: q.updated_at || q.updatedAt || Date.now()
    };
  }

  function normMessage(m) {
    if (m.contact !== undefined) return m; // فرمت UI
    return {
      id: m.id, userId: m.from_user || m.userId || '',
      name: m.name || 'کاربر', contact: m.contact || '',
      body: m.body || '', reply: m.reply || '',
      status: m.read ? 'answered' : 'open',
      createdAt: m.created_at || m.createdAt || Date.now(),
      repliedAt: m.repliedAt || 0
    };
  }

  /* ── نمای داده هیبریدی ─────────────────────────────────── */
  const API = { CATS, Q_STATUS, API_BASE, cache, queue, normProduct, normQuote, normMessage };

  API.mode = () => mode;
  API.onMode = (fn) => listeners.push(fn);

  API.available = async () => {
    try {
      await req('GET', '/health');
      return true;
    } catch (_) { return false; }
  };

  /* احراز هویت */
  API.me = async function () {
    try {
      const d = await req('GET', '/auth/me');
      cache.set('me', d.user);
      return d.user;
    } catch (e) {
      if (e.code === 401) { try { localStorage.removeItem('lns:cache:me'); } catch (_) {} return null; }
      const c = cache.get('me', null);
      if (c) return c;
      return window.LNS ? LNS.me() : null;
    }
  };

  API.register = async function (o) {
    try {
      const d = await req('POST', '/auth/register', o);
      cache.set('me', d.user);
      return { ok: true, user: d.user };
    } catch (e) {
      if (e.message === 'OFFLINE') {
        if (!window.LNS) return { ok: false, error: 'آفلاین هستید — بعداً تلاش کنید.' };
        await LNS.ready();
        return LNS.register(o);
      }
      return { ok: false, error: e.message };
    }
  };

  API.login = async function (ident, pass) {
    try {
      const d = await req('POST', '/auth/login', { identifier: ident, pass });
      cache.set('me', d.user);
      return { ok: true, user: d.user };
    } catch (e) {
      if (e.message === 'OFFLINE') {
        if (!window.LNS) return { ok: false, error: 'آفلاین هستید — بعداً تلاش کنید.' };
        await LNS.ready();
        return LNS.login(ident, pass);
      }
      return { ok: false, error: e.message };
    }
  };

  API.logout = async function () {
    try { await req('POST', '/auth/logout', {}); } catch (_) {}
    try { localStorage.removeItem('lns:cache:me'); } catch (_) {}
    if (window.LNS) LNS.logout();
  };

  /* محصولات */
  API.products = async function () {
    try {
      const d = await req('GET', '/products/list?limit=100');
      const list = (d.items || []).map(normProduct);
      cache.set('products', list);
      return list;
    } catch (_) {
      const c = cache.get('products', null);
      if (c) return c;
      if (!window.LNS) return [];
      await LNS.ready();
      return LNS.products();
    }
  };

  API.product = async function (id) {
    const list = await API.products();
    return list.find((p) => p.id === id) || null;
  };

  API.saveProduct = async function (data) {
    const isNew = !data.id;
    const body = {
      id: data.id, name: data.name, cat: data.cat,
      price: data.price, stock: data.stock,
      description: data.desc, image: ''
    };
    try {
      const d = await req('POST', isNew ? '/products/create' : '/products/update', body);
      return { ok: true, id: d.id || data.id };
    } catch (e) {
      if (e.message === 'OFFLINE') { queue.push({ path: isNew ? '/products/create' : '/products/update', body }); }
      if (!window.LNS) return { ok: false, error: e.message };
      await LNS.ready();
      return LNS.saveProduct(data);
    }
  };

  API.deleteProduct = async function (id) {
    try {
      await req('POST', '/products/delete', { id });
      return { ok: true };
    } catch (e) {
      if (e.message === 'OFFLINE') queue.push({ path: '/products/delete', body: { id } });
      if (!window.LNS) return { ok: false, error: e.message };
      await LNS.ready();
      return LNS.deleteProduct(id);
    }
  };

  /* استعلام‌ها */
  API.quotes = async function () {
    try {
      const d = await req('GET', '/quotes/list?limit=100');
      const prods = await API.products().catch(() => []);
      const byId = (id) => prods.find((p) => p.id === id);
      const list = (d.items || []).map((q) => normQuote(q, byId));
      cache.set('quotes', list);
      return list;
    } catch (_) {
      const c = cache.get('quotes', null);
      if (c) return c;
      if (!window.LNS) return [];
      await LNS.ready();
      return LNS.quotes();
    }
  };

  API.myQuotes = async function (userId) {
    const all = await API.quotes();
    return all.filter((q) => !q.userId || q.userId === userId);
  };

  API.createQuote = async function (o) {
    const body = { items: o.items, note: o.note };
    try {
      await req('POST', '/quotes/create', body);
      return { ok: true };
    } catch (e) {
      if (e.message === 'OFFLINE') queue.push({ path: '/quotes/create', body });
      if (!window.LNS) return { ok: false, error: e.message };
      await LNS.ready();
      return LNS.createQuote(o);
    }
  };

  API.setQuoteStatus = async function (id, status, adminNote) {
    try {
      await req('POST', '/quotes/update', { id, status, adminNote });
      return { ok: true };
    } catch (e) {
      if (e.message === 'OFFLINE') queue.push({ path: '/quotes/update', body: { id, status, adminNote } });
      if (!window.LNS) return { ok: false, error: e.message };
      await LNS.ready();
      return LNS.setQuoteStatus(id, status, adminNote);
    }
  };

  /* پیام‌ها */
  API.messages = async function () {
    try {
      const d = await req('GET', '/messages/list?limit=100');
      const list = (d.items || []).map(normMessage);
      cache.set('messages', list);
      return list;
    } catch (_) {
      const c = cache.get('messages', null);
      if (c) return c;
      if (!window.LNS) return [];
      await LNS.ready();
      return LNS.messages();
    }
  };

  API.myMessages = async function (userId) {
    const all = await API.messages();
    return all.filter((m) => !m.userId || m.userId === userId);
  };

  API.sendMessage = async function (o) {
    const body = { subject: o.subject || '', body: o.body };
    try {
      await req('POST', '/messages/send', body);
      return { ok: true };
    } catch (e) {
      if (e.message === 'OFFLINE') queue.push({ path: '/messages/send', body });
      if (!window.LNS) return { ok: false, error: e.message };
      await LNS.ready();
      return LNS.saveMessage(o);
    }
  };

  /* کاربران (ادمین) */
  API.users = async function () {
    const d = await req('GET', '/users/list?limit=100');
    cache.set('users', d.items || []);
    return d.items || [];
  };

  API.setUserStatus = async function (id, status) {
    await req('POST', '/users/update', { id, status });
    return { ok: true };
  };

  API.setUserRole = async function (id, role) {
    await req('POST', '/users/update', { id, role });
    return { ok: true };
  };

  /* پاسخ پیام (فعلاً محلی — endpoint بک‌اند در فاز بعد) */
  API.replyMessage = async function (id, reply) {
    if (!window.LNS) return { ok: false, error: 'آفلاین.' };
    await LNS.ready();
    return LNS.replyMessage(id, reply);
  };

  /* علاقه‌مندی‌ها (محلی) */
  API.favs = function (userId) {
    if (!window.LNS) return [];
    return LNS.favs(userId);
  };
  API.toggleFav = function (userId, pid) {
    if (!window.LNS) return false;
    return LNS.toggleFav(userId, pid);
  };

  /* تنظیمات/پروفایل (محلی تا فاز بعد) */
  API.settings = function () { return window.LNS ? LNS.settings() : {}; };
  API.saveSettings = function (o) { return window.LNS ? LNS.saveSettings(o) : { ok: false, error: 'آفلاین.' }; };

  window.API = API;
})();
