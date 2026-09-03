/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — پنل مدیریت
   داشبورد · CRUD محصولات · استعلام‌ها · پیام‌ها · کاربران · تنظیمات
   ═══════════════════════════════════════════════════════════ */
'use strict';

(async function () {

  await LNS.ready();
  const { h, money, faNum, faDate, faTime, relTime, toast, badge, openModal } = UI;

  const admin = LNS.requireRole('admin', 'admin.html');
  if (!admin) return;

  const $ = (s) => document.querySelector(s);
  const main = $('#pMain'), nav = $('#pNav');

  /* ── هدر ──────────────────────────────────────────────── */
  (function chip() {
    $('#adminSide').append(
      h('span', { class: 'user-chip' }, [
        h('span', { class: 'user-avatar', text: 'م' }),
        h('span', { text: admin.name })
      ])
    );
  })();

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (!btn) return;
    nav.querySelectorAll('button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    render(btn.dataset.view);
  });
  $('#logoutBtn').addEventListener('click', () => { LNS.logout(); location.href = 'auth.html'; });

  const head = (t, sub) => h('div', { class: 'p-head' }, [
    h('div', {}, [h('div', { class: 'p-title', text: t }), sub ? h('div', { class: 'p-sub', text: sub }) : null]),
  ]);

  const field = (label, input, hint) => h('div', { class: 'p-field' }, [
    h('label', { text: label }), input,
    hint ? h('small', { class: 'hint', text: hint }) : null
  ]);

  /* ══ داشبورد ════════════════════════════════════════════ */
  function viewDash() {
    const users = LNS.users(), quotes = LNS.quotes(), msgs = LNS.messages(), prods = LNS.products();
    const newQ = quotes.filter(q => q.status === 'new').length;
    const openM = msgs.filter(m => m.status === 'open').length;

    const chart = h('div', { class: 'chart' });
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ start: d.getTime(), end: d.getTime() + 86400000 });
    }
    const perDay = days.map(w => quotes.filter(q => q.createdAt >= w.start && q.createdAt < w.end).length);
    const max = Math.max(1, ...perDay);
    const dayName = (ts) => { try { return new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(new Date(ts)); } catch (_) { return ''; } };
    days.forEach((w, i) => {
      const bar = h('div', { class: 'bar' }, [
        h('b', { text: perDay[i] ? faNum(perDay[i]) : '' }),
        h('span', { text: dayName(w.start) })
      ]);
      bar.style.setProperty('height', Math.max(6, Math.round(perDay[i] / max * 100)) + '%');
      chart.appendChild(bar);
    });

    return h('div', {}, [
      head('داشبورد مدیریت', 'نمای کلی فروشگاه و درخواست‌های مشتریان'),
      h('div', { class: 'stats' }, [
        stat(users.length, 'کاربر ثبت‌شده'),
        stat(newQ, 'استعلام جدید'),
        stat(quotes.length, 'کل استعلام‌ها'),
        stat(openM, 'پیام بی‌پاسخ'),
        stat(prods.length, 'محصول فعال')
      ]),
      head('استعلام‌های ۷ روز اخیر', ''),
      h('div', { class: 'chart-wrap' }, [chart]),
      h('div', { class: 'stats' }, [
        lastQuotes(quotes), lastMsgs(msgs)
      ])
    ]);

    function stat(n, label) { return h('div', { class: 'stat' }, [h('span', { text: label }), h('b', { text: faNum(n) })]); }
    function lastQuotes(qs) {
      const box = h('div', { class: 'stat' }, [h('b', { text: 'آخرین استعلام‌ها' })]);
      if (!qs.length) box.appendChild(h('span', { text: 'هنوز استعلامی ثبت نشده.' }));
      else qs.slice(0, 4).forEach(q => box.appendChild(h('span', { text: '• ' + q.userName + ' — ' + relTime(q.createdAt) })));
      return box;
    }
    function lastMsgs(ms) {
      const box = h('div', { class: 'stat' }, [h('b', { text: 'آخرین پیام‌ها' })]);
      if (!ms.length) box.appendChild(h('span', { text: 'پیامی وجود ندارد.' }));
      else ms.slice(0, 4).forEach(m => box.appendChild(h('span', { text: '• ' + m.name + ' — ' + relTime(m.createdAt) })));
      return box;
    }
  }

  /* ══ محصولات (CRUD) ═════════════════════════════════════ */
  function viewProducts() {
    const list = LNS.products();
    const tbl = h('table', { class: 'p-table' }, [
      h('thead', {}, h('tr', {}, [
        'محصول', 'دسته', 'قیمت (متر)', 'موجودی', 'برچسب', 'ویژه', 'عملیات'
      ].map(t => h('th', { text: t })))),
      h('tbody', {}, list.map(p => h('tr', {}, [
        h('td', {}, [h('b', { text: p.name })]),
        h('td', { text: LNS.CATS[p.cat] || p.cat }),
        h('td', { text: money(p.price) }),
        h('td', { text: p.stock ? faNum(p.stock) : '—' }),
        h('td', { text: p.badge || '—' }),
        h('td', { text: p.featured ? '★' : '—' }),
        h('td', {}, [h('div', { class: 'td-actions' }, [
          h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'ویرایش', onclick: () => productModal(p) }),
          h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'حذف', onclick: () => del(p) })
        ])])
      ])))
    ]);

    return h('div', {}, [
      head('مدیریت محصولات', faNum(list.length) + ' محصول در فروشگاه'),
      h('button', { class: 'btn btn-primary', type: 'button', text: '+ افزودن محصول جدید', onclick: () => productModal(null) }),
      h('br'), h('br'),
      h('div', { class: 'table-wrap' }, [tbl])
    ]);

    function del(p) {
      const m = openModal({
        title: 'حذف محصول',
        body: h('p', { text: '«' + p.name + '» برای همیشه از فروشگاه حذف شود؟' }),
        footer: h('div', { class: 'td-actions' }, [
          h('button', { class: 'btn btn-outline', type: 'button', text: 'انصراف', onclick: () => m.close() }),
          h('button', { class: 'btn btn-primary', type: 'button', text: 'حذف قطعی', onclick: () => {
            const res = LNS.deleteProduct(p.id);
            m.close();
            if (!res.ok) { toast(res.error, 'err'); return; }
            toast('محصول حذف شد.', 'ok'); render('products'); counters();
          } })
        ])
      });
    }
  }

  function productModal(p) {
    const isNew = !p;
    const nameI = h('input', { type: 'text', maxlength: 80, value: p ? p.name : '', placeholder: 'مثلاً: لاین نوری ۲۲۰ولت تک‌رنگ' });
    const catS = h('select', {}, Object.entries(LNS.CATS).map(([id, label]) =>
      h('option', { value: id, text: label, selected: p && p.cat === id ? 'selected' : null })
    ));
    const priceI = h('input', { type: 'text', inputmode: 'numeric', maxlength: 12, value: p ? String(p.price) : '', placeholder: 'قیمت هر متر به تومان' });
    const oldI = h('input', { type: 'text', inputmode: 'numeric', maxlength: 12, value: p && p.oldPrice ? String(p.oldPrice) : '', placeholder: 'خالی = بدون تخفیف' });
    const wattI = h('input', { type: 'text', maxlength: 20, value: p ? p.watt : '', placeholder: '8W/m' });
    const ipI = h('input', { type: 'text', maxlength: 12, value: p ? p.ip : '', placeholder: 'IP65' });
    const voltI = h('input', { type: 'text', maxlength: 20, value: p ? p.volt : '', placeholder: '220V' });
    const warI = h('input', { type: 'text', inputmode: 'numeric', maxlength: 4, value: p ? String(p.warranty || '') : '', placeholder: 'ماه' });
    const stockI = h('input', { type: 'text', inputmode: 'numeric', maxlength: 6, value: p ? String(p.stock || '') : '', placeholder: 'متر' });
    const badgeI = h('input', { type: 'text', maxlength: 20, value: p ? (p.badge || '') : '', placeholder: 'پرفروش / جدید / … (خالی = بدون)' });
    const glowI = h('input', { type: 'color', value: p ? (p.glow || '#FFC966') : '#FFC966' });
    const colorsI = h('input', { type: 'text', maxlength: 120, value: p && p.colors ? p.colors.join(', ') : '#FFC966, #FFFFFF', placeholder: '#FFC966, #FFFFFF' });
    const descI = h('textarea', { maxlength: 500, placeholder: 'توضیح کوتاه محصول…' });
    if (p && p.desc) descI.value = p.desc;
    const featI = h('input', { type: 'checkbox' });
    if (p && p.featured) featI.checked = true;

    const box = h('div', {}, [
      field('نام محصول *', nameI),
      h('div', { class: 'form-row' }, [field('دسته *', catS), field('رنگ گلو ویژوال', glowI)]),
      h('div', { class: 'form-row' }, [field('قیمت هر متر (تومان) *', priceI), field('قیمت قبل از تخفیف', oldI)]),
      h('div', { class: 'form-row' }, [field('توان', wattI), field('ضدآب', ipI)]),
      h('div', { class: 'form-row' }, [field('ولتاژ', voltI), field('ضمانت (ماه)', warI)]),
      h('div', { class: 'form-row' }, [field('موجودی (متر)', stockI), field('برچسب', badgeI)]),
      field('رنگ‌های نور (با ویرگول)', colorsI, 'کدهای HEX مثل #FFC966 — برای سواچ کارت محصول'),
      field('توضیح', descI),
      h('label', { class: 'switch' }, [featI, h('i', {}), h('span', { text: 'نمایش در «پیشنهاد ما» (ویژه)' })])
    ]);

    const m = openModal({
      title: isNew ? 'افزودن محصول جدید' : 'ویرایش محصول', wide: true, body: box,
      footer: h('div', { class: 'td-actions' }, [
        h('button', { class: 'btn btn-outline', type: 'button', text: 'انصراف', onclick: () => m.close() }),
        h('button', { class: 'btn btn-primary', type: 'button', text: isNew ? 'افزودن' : 'ذخیره', onclick: save })
      ])
    });

    async function save() {
      const res = LNS.saveProduct({
        id: p ? p.id : undefined,
        name: nameI.value, cat: catS.value,
        price: priceI.value, oldPrice: oldI.value,
        watt: wattI.value, ip: ipI.value, volt: voltI.value,
        warranty: warI.value, stock: stockI.value,
        badge: badgeI.value,
        glow: glowI.value,
        colors: colorsI.value.split(',').map(s => s.trim()).filter(Boolean),
        desc: descI.value,
        featured: featI.checked
      });
      if (!res.ok) { toast(res.error, 'err'); return; }
      m.close();
      toast(isNew ? 'محصول اضافه شد.' : 'تغییرات ذخیره شد.', 'ok');
      render('products'); counters();
    }
  }

  /* ══ استعلام‌ها ═════════════════════════════════════════ */
  function viewQuotes() {
    const list = LNS.quotes();
    if (!list.length) return h('div', { class: 'empty' }, [
      h('b', { text: 'هنوز استعلامی ثبت نشده' }),
      h('p', { text: 'استعلام‌های مشتریان از فروشگاه اینجا نمایش داده می‌شود.' })
    ]);

    const body = h('div', {}, [head('استعلام‌های مشتریان', faNum(list.length) + ' درخواست')]);
    list.forEach(q => {
      const stS = h('select', {}, Object.entries(LNS.Q_STATUS).map(([id, label]) =>
        h('option', { value: id, text: label, selected: q.status === id ? 'selected' : null })
      ));
      stS.value = q.status;
      const noteI = h('textarea', { maxlength: 400, placeholder: 'پاسخ/توضیح برای مشتری (پیش‌فاکتور، زمان اجرا…)' });
      noteI.value = q.adminNote || '';
      const saveBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', text: 'ذخیره وضعیت', onclick: () => {
        const res = LNS.setQuoteStatus(q.id, stS.value, noteI.value);
        if (!res.ok) { toast(res.error, 'err'); return; }
        toast('وضعیت به‌روزرسانی شد — مشتری در پنل خودش می‌بیند.', 'ok');
        render('quotes'); counters();
      } });

      body.appendChild(h('div', { class: 'table-wrap' }, h('div', { class: 'modal-body' }, [
        h('div', { class: 'quote-head' }, [
          h('b', { text: q.userName + ' · ' + (q.userPhone || '—') }),
          badge(LNS.Q_STATUS[q.status], { new: 'gold', review: 'cyan', invoice: 'violet', done: 'green', rejected: 'red' }[q.status] || 'muted')
        ]),
        h('table', { class: 'pd-specs' }, q.items.map(it =>
          h('tr', {}, [h('td', { text: it.name }), h('td', { text: faNum(it.qty) + ' متر' })])
        )),
        q.note ? h('p', { class: 'pd-desc', text: 'توضیح مشتری: ' + q.note }) : null,
        h('p', { class: 'p-sub', text: 'ثبت: ' + faDate(q.createdAt) + ' — ' + faTime(q.createdAt) }),
        h('br'),
        h('div', { class: 'form-row' }, [field('وضعیت', stS), field('', saveBtn)]),
        field('پاسخ شما', noteI)
      ])), h('br'));
    });
    return body;
  }

  /* ══ پیام‌ها ════════════════════════════════════════════ */
  function viewMsgs() {
    const list = LNS.messages();
    if (!list.length) return h('div', { class: 'empty' }, [
      h('b', { text: 'صندوق پیام خالی است' }),
      h('p', { text: 'پیام‌های فرم مشاوره صفحه اصلی و پنل کاربران اینجا می‌آید.' })
    ]);

    const body = h('div', {}, [head('صندوق پیام‌ها', faNum(list.length) + ' پیام')]);
    list.forEach(m => {
      const replyI = h('textarea', { maxlength: 600, placeholder: m.reply ? 'ویرایش پاسخ…' : 'پاسخ خود را بنویسید…' });
      replyI.value = m.reply || '';
      const saveBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', text: m.reply ? 'به‌روزرسانی پاسخ' : 'ارسال پاسخ', onclick: () => {
        const res = LNS.replyMessage(m.id, replyI.value);
        if (!res.ok) { toast(res.error, 'err'); return; }
        toast('پاسخ ثبت شد.', 'ok');
        render('msgs'); counters();
      } });
      body.appendChild(h('div', { class: 'table-wrap' }, h('div', { class: 'modal-body' }, [
        h('div', { class: 'quote-head' }, [
          h('b', { text: m.name + (m.contact ? ' · ' + m.contact : '') }),
          badge(m.status === 'answered' ? 'پاسخ داده شد' : 'بی‌پاسخ', m.status === 'answered' ? 'green' : 'gold')
        ]),
        h('div', { class: 'bubble bubble-in' }, [
          h('span', { text: m.body }),
          h('small', { text: relTime(m.createdAt) })
        ]),
        h('br'),
        field('پاسخ', replyI),
        saveBtn
      ])), h('br'));
    });
    return body;
  }

  /* ══ کاربران ════════════════════════════════════════════ */
  function viewUsers() {
    const list = LNS.users();
    const tbl = h('table', { class: 'p-table' }, [
      h('thead', {}, h('tr', {}, ['نام', 'موبایل', 'ایمیل', 'نقش', 'وضعیت', 'عضویت', 'عملیات'].map(t => h('th', { text: t })))),
      h('tbody', {}, list.map(u => {
        const isSelf = u.id === admin.id;
        return h('tr', {}, [
          h('td', {}, [h('b', { text: u.name + (isSelf ? ' (شما)' : '') })]),
          h('td', { text: u.phone || '—' }),
          h('td', { text: u.email || '—' }),
          h('td', {}, [badge(u.role === 'admin' ? 'مدیر' : 'مشتری', u.role === 'admin' ? 'violet' : 'cyan')]),
          h('td', {}, [badge(u.status === 'blocked' ? 'مسدود' : 'فعال', u.status === 'blocked' ? 'red' : 'green')]),
          h('td', { text: faDate(u.createdAt) }),
          h('td', {}, [h('div', { class: 'td-actions' }, isSelf ? [h('span', { class: 'p-sub', text: '—' })] : [
            h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: u.status === 'blocked' ? 'رفع مسدودی' : 'مسدودسازی', onclick: () => setSt(u, u.status === 'blocked' ? 'active' : 'blocked') }),
            h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: u.role === 'admin' ? 'سلب مدیریت' : 'ارتقا به مدیر', onclick: () => setRole(u, u.role === 'admin' ? 'customer' : 'admin') })
          ])])
        ]);
      }))
    ]);
    return h('div', {}, [
      head('کاربران', faNum(list.length) + ' حساب ثبت‌شده'),
      h('div', { class: 'table-wrap' }, [tbl])
    ]);

    function setSt(u, s) {
      const res = LNS.setUserStatus(u.id, s);
      if (!res.ok) { toast(res.error, 'err'); return; }
      toast(s === 'blocked' ? 'کاربر مسدود شد.' : 'کاربر فعال شد.', 'ok');
      render('users'); counters();
    }
    function setRole(u, r) {
      const res = LNS.setUserRole(u.id, r);
      if (!res.ok) { toast(res.error, 'err'); return; }
      toast(r === 'admin' ? 'کاربر ارتقا یافت.' : 'نقش به مشتری تغییر کرد.', 'ok');
      render('users');
    }
  }

  /* ══ تنظیمات ════════════════════════════════════════════ */
  function viewSettings() {
    const s = LNS.settings();
    const phoneI = h('input', { type: 'tel', inputmode: 'tel', maxlength: 16, value: s.phone });
    const waI = h('input', { type: 'tel', inputmode: 'tel', maxlength: 16, value: s.phone });
    const mailI = h('input', { type: 'email', maxlength: 80, value: s.email });
    const addrI = h('textarea', { maxlength: 160 });
    addrI.value = s.address;
    const instaI = h('input', { type: 'text', maxlength: 80, value: s.instagram || '', placeholder: 'instagram.com/…' });

    const siteBox = h('div', { class: 'table-wrap' }, h('div', { class: 'modal-body' }, [
      h('div', { class: 'p-title', text: 'اطلاعات تماس سایت' }),
      h('p', { class: 'p-sub', text: 'این اطلاعات پایه تماس سیستم را تعیین می‌کند.' }),
      h('br'),
      h('div', { class: 'form-row' }, [field('تلفن', phoneI), field('واتساپ', waI)]),
      field('ایمیل', mailI),
      field('نشانی', addrI),
      field('اینستاگرام (اختیاری)', instaI),
      h('button', { class: 'btn btn-primary', type: 'button', text: 'ذخیره تنظیمات', onclick: saveSite })
    ]));

    const curP = h('input', { type: 'password', maxlength: 64, autocomplete: 'current-password', placeholder: 'گذرواژه فعلی' });
    const newP = h('input', { type: 'password', maxlength: 64, autocomplete: 'new-password', placeholder: 'گذرواژه جدید (حداقل ۸، حرف + عدد)' });
    const newP2 = h('input', { type: 'password', maxlength: 64, autocomplete: 'new-password', placeholder: 'تکرار گذرواژه جدید' });
    const passBox = h('div', { class: 'table-wrap' }, h('div', { class: 'modal-body' }, [
      h('div', { class: 'p-title', text: 'امنیت حساب مدیر' }),
      h('p', { class: 'p-sub', text: '⚠️ اگر هنوز گذرواژه پیش‌فرض نصب را تغییر نداده‌اید، همین حالا تغییرش دهید.' }),
      h('br'),
      field('گذرواژه فعلی', curP),
      h('div', { class: 'form-row' }, [field('گذرواژه جدید', newP), field('تکرار', newP2)]),
      h('button', { class: 'btn btn-outline', type: 'button', text: 'تغییر گذرواژه', onclick: savePass })
    ]));

    const aboutBox = h('div', { class: 'table-wrap' }, h('div', { class: 'modal-body' }, [
      h('div', { class: 'p-title', text: 'درباره این پنل' }),
      h('p', { class: 'pd-desc', text: 'داده‌های این نسخه (کاربران، محصولات، استعلام‌ها و پیام‌ها) در همین مرورگر ذخیره می‌شود — برای نسخه چندکاربره و ابری، اتصال به بک‌اند (Supabase/Firebase) در نقشه راه قرار دارد و لایه دیتا از قبل برای مهاجرت آماده است.' })
    ]));

    return h('div', {}, [
      head('تنظیمات', 'پیکربندی تماس و امنیت حساب'),
      siteBox, h('br'), passBox, h('br'), aboutBox
    ]);

    function saveSite() {
      const res = LNS.saveSettings({ phone: phoneI.value, whatsapp: waI.value, email: mailI.value, address: addrI.value, instagram: instaI.value });
      if (!res.ok) { toast(res.error, 'err'); return; }
      toast('تنظیمات ذخیره شد.', 'ok');
    }
    async function savePass() {
      if (newP.value !== newP2.value) { toast('تکرار گذرواژه مطابقت ندارد.', 'err'); return; }
      const res = await LNS.changePassword(admin.id, curP.value, newP.value);
      if (!res.ok) { toast(res.error, 'err'); return; }
      curP.value = newP.value = newP2.value = '';
      toast('گذرواژه مدیر تغییر کرد.', 'ok');
    }
  }

  /* ── رندر ─────────────────────────────────────────────── */
  const views = { dash: viewDash, products: viewProducts, quotes: viewQuotes, msgs: viewMsgs, users: viewUsers, settings: viewSettings };

  function render(view) {
    main.textContent = '';
    main.appendChild(views[view]());
  }

  function counters() {
    set('#cProducts', LNS.products().length);
    set('#cQuotes', LNS.quotes().filter(q => q.status === 'new').length);
    set('#cMsgs', LNS.messages().filter(m => m.status === 'open').length);
    set('#cUsers', LNS.users().length);
    function set(sel, n) { const el = $(sel); el.hidden = !n; el.textContent = faNum(n); }
  }

  render('dash');
  counters();
  LNS.onSync(() => counters());
})();
