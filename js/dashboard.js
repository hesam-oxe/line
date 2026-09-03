/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — پنل کاربر
   داشبورد · استعلام‌ها · پیام‌ها · علاقه‌مندی‌ها · پروفایل
   ═══════════════════════════════════════════════════════════ */
'use strict';

(async function () {

  await LNS.ready();
  const { h, money, faNum, faDate, relTime, toast, badge, openModal } = UI;

  const user = LNS.requireRole(null, 'dashboard.html');
  if (!user) return;

  const $ = (s) => document.querySelector(s);
  const main = $('#pMain'), nav = $('#pNav');

  /* ── هدر کاربر ────────────────────────────────────────── */
  (function chip() {
    const side = $('#userSide');
    if (user.role === 'admin') {
      side.append(h('a', { class: 'btn btn-outline btn-sm', href: 'admin.html', text: 'پنل مدیریت' }));
    }
    side.append(h('span', { class: 'user-chip' }, [
      h('span', { class: 'user-avatar', text: (user.name || '?').trim().charAt(0) }),
      h('span', { text: user.name })
    ]));
  })();

  /* ── ناوبری ───────────────────────────────────────────── */
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (!btn) return;
    nav.querySelectorAll('button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    render(btn.dataset.view);
  });

  $('#logoutBtn').addEventListener('click', () => {
    LNS.logout();
    location.href = 'index.html';
  });

  /* ── داده‌ها ──────────────────────────────────────────── */
  const myQ = () => LNS.myQuotes(user.id);
  const myM = () => LNS.myMessages(user.id);
  const favList = () => LNS.favs(user.id).map(LNS.product).filter(Boolean);

  const statusTone = { new: 'gold', review: 'cyan', invoice: 'violet', done: 'green', rejected: 'red' };

  /* ── نماهای پنل ───────────────────────────────────────── */

  function viewDash() {
    const qs = myQ(), ms = myM(), fs = favList();
    const answered = qs.filter(q => ['invoice', 'done'].includes(q.status)).length;
    const wrap = h('div', {}, [
      head('سلام ' + user.name.split(' ')[0] + ' 👋', 'خلاصه فعالیت شما در لاین نوری استار'),
      h('div', { class: 'stats' }, [
        stat(qs.length, 'استعلام ثبت‌شده'),
        stat(answered, 'پاسخ داده‌شده'),
        stat(ms.filter(m => m.status === 'answered').length, 'پیام پاسخ‌گرفته'),
        stat(fs.length, 'علاقه‌مندی')
      ]),
      h('div', { class: 'stats' }, [
        actionCard('فروشگاه محصولات', 'قیمت روز انواع لاین نوری + ثبت استعلام آنلاین', 'products.html', 'مشاهده فروشگاه'),
        actionCard('نیاز به مشاوره دارید؟', 'کارشناسان ما برای انتخاب نور مناسب کنار شما هستند.', 'index.html#contact', 'درخواست مشاوره'),
        actionCard('شبیه‌ساز رنگ نور', 'قبل از خرید، رنگ نور را روی فضای خودتان ببینید.', 'index.html#simulator', 'شبیه‌سازی نور')
      ]),
      qs.length ? h('div', {}, [head('آخرین استعلام', ''), quoteCard(qs[0])]) : null
    ]);
    return wrap;
  }

  function stat(n, label) {
    return h('div', { class: 'stat' }, [h('span', { text: label }), h('b', { text: faNum(n) })]);
  }
  function actionCard(title, desc, href, btnLabel) {
    return h('div', { class: 'stat' }, [
      h('b', { text: title }),
      h('span', { text: desc }),
      h('a', { class: 'btn btn-outline btn-sm', href, text: btnLabel })
    ]);
  }
  function head(t, sub) {
    return h('div', { class: 'p-head' }, [
      h('div', {}, [h('div', { class: 'p-title', text: t }), sub ? h('div', { class: 'p-sub', text: sub }) : null])
    ]);
  }

  /* ── کارت استعلام ─────────────────────────────────────── */
  const FLOW = ['new', 'review', 'invoice', 'done'];

  function quoteCard(q) {
    const tone = statusTone[q.status] || 'muted';
    const flow = h('div', { class: 'q-flow' }, FLOW.map(s =>
      h('div', { class: 'q-step' + (q.status === s ? ' hit' : (FLOW.indexOf(q.status) > FLOW.indexOf(s) ? ' hit' : '')), text: LNS.Q_STATUS[s] })
    ));
    if (q.status === 'rejected') {
      const bad = h('div', { class: 'q-step bad hit', text: LNS.Q_STATUS.rejected });
      flow.appendChild(bad);
    }
    return h('div', { class: 'table-wrap' }, [
      h('div', { class: 'quote-head' }, [
        h('b', { text: 'استعلام ' + relTime(q.createdAt) }),
        badge(LNS.Q_STATUS[q.status], tone)
      ]),
      h('div', { class: 'modal-body' }, [
        h('table', { class: 'pd-specs' },
          q.items.map(it => h('tr', {}, [
            h('td', { text: it.name }),
            h('td', { text: faNum(it.qty) + ' متر' })
          ]))
        ),
        q.note ? h('p', { class: 'pd-desc', text: 'توضیح شما: ' + q.note }) : null,
        q.adminNote ? h('div', { class: 'bubble bubble-out', text: 'پاسخ کارشناس: ' + q.adminNote }) : null,
        flow
      ])
    ]);
  }

  function viewQuotes() {
    const qs = myQ();
    if (!qs.length) return emptyPanel('هنوز استعلامی ثبت نکرده‌اید', 'از فروشگاه محصولات را به سبد استعلام اضافه کنید.', 'products.html', 'رفتن به فروشگاه');
    return h('div', {}, [
      head('استعلام‌های من', faNum(qs.length) + ' درخواست — وضعیت‌ها را اینجا پیگیری کنید'),
      h('div', { class: 'thread' }, qs.map(quoteCard))
    ]);
  }

  function emptyPanel(title, desc, href, btn) {
    return h('div', { class: 'empty' }, [
      h('b', { text: title }),
      h('p', { text: desc }),
      href ? h('a', { class: 'btn btn-primary btn-sm', href, text: btn }) : null
    ]);
  }

  /* ── پیام‌ها ──────────────────────────────────────────── */
  function viewMsgs() {
    const ms = myM();
    const body = h('div', {}, [head('پیام‌های من', 'گفتگو با پشتیبانی لاین نوری استار')]);

    /* فرم پیام جدید */
    const form = h('form', { class: 'table-wrap' });
    const inner = h('div', { class: 'modal-body' });
    const ta = h('textarea', { maxlength: 600, placeholder: 'سوال یا درخواست خود را بنویسید…', 'aria-label': 'متن پیام' });
    inner.append(
      h('div', { class: 'p-field' }, [h('label', { text: 'پیام جدید' }), ta]),
      h('button', { class: 'btn btn-primary', type: 'submit', text: 'ارسال پیام' })
    );
    form.appendChild(inner);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = ta.value.trim();
      if (!v) { toast('متن پیام خالی است.', 'err'); return; }
      const res = LNS.saveMessage({ name: user.name, contact: user.phone || user.email, body: v, userId: user.id });
      if (!res.ok) { toast(res.error, 'err'); return; }
      ta.value = '';
      toast('پیام ارسال شد — به‌زودی پاسخ می‌دهیم.', 'ok');
      render('msgs');
    });
    body.appendChild(form);

    if (!ms.length) {
      body.appendChild(h('div', { class: 'empty' }, [
        h('b', { text: 'گفتگویی وجود ندارد' }),
        h('p', { text: 'اولین پیام خود را بالای همین صفحه بنویسید.' })
      ]));
      return body;
    }
    const thread = h('div', { class: 'thread' });
    ms.forEach(m => {
      thread.append(
        h('div', { class: 'bubble bubble-in' }, [
          h('span', { text: m.body }),
          h('small', { text: 'شما · ' + relTime(m.createdAt) })
        ])
      );
      if (m.reply) {
        thread.append(h('div', { class: 'bubble bubble-out' }, [
          h('span', { text: m.reply }),
          h('small', { text: 'پشتیبانی · ' + relTime(m.repliedAt) })
        ]));
      }
    });
    body.appendChild(thread);
    return body;
  }

  /* ── علاقه‌مندی‌ها ────────────────────────────────────── */
  function viewFavs() {
    const fs = favList();
    if (!fs.length) return emptyPanel('لیست علاقه‌مندی خالی است', 'در فروشگاه روی ❤ محصولات بزنید تا اینجا ذخیره شوند.', 'products.html', 'رفتن به فروشگاه');
    return h('div', {}, [
      head('علاقه‌مندی‌ها', faNum(fs.length) + ' محصول ذخیره‌شده'),
      h('div', { class: 'stats' }, fs.map(p => {
        const c = h('div', { class: 'stat' }, [
          h('b', { text: p.name }),
          h('span', { text: money(p.price) + ' / متر' }),
          h('a', { class: 'btn btn-outline btn-sm', href: 'products.html', text: 'مشاهده در فروشگاه' })
        ]);
        c.style.setProperty('--pc', p.glow || '#FFC966');
        return c;
      }))
    ]);
  }

  /* ── پروفایل ──────────────────────────────────────────── */
  function viewProfile() {
    const nameI = h('input', { type: 'text', maxlength: 60, value: user.name, autocomplete: 'name' });
    const phoneI = h('input', { type: 'tel', inputmode: 'tel', maxlength: 16, value: user.phone || '', autocomplete: 'tel' });
    const emailI = h('input', { type: 'email', inputmode: 'email', maxlength: 80, value: user.email || '', autocomplete: 'email' });

    const curP = h('input', { type: 'password', maxlength: 64, autocomplete: 'current-password', placeholder: 'گذرواژه فعلی' });
    const newP = h('input', { type: 'password', maxlength: 64, autocomplete: 'new-password', placeholder: 'گذرواژه جدید (حداقل ۸، حرف + عدد)' });
    const newP2 = h('input', { type: 'password', maxlength: 64, autocomplete: 'new-password', placeholder: 'تکرار گذرواژه جدید' });

    const info = h('div', { class: 'table-wrap' }, h('div', { class: 'modal-body' }, [
      h('div', { class: 'form-row' }, [
        field('نام و نام خانوادگی', nameI),
        field('شماره موبایل', phoneI)
      ]),
      field('ایمیل', emailI),
      h('button', { class: 'btn btn-primary', type: 'button', text: 'ذخیره تغییرات', onclick: saveProfile }),
      h('p', { class: 'p-sub', text: 'عضویت شما از ' + faDate(user.createdAt) + ' — سطح دسترسی: ' + (user.role === 'admin' ? 'مدیر سیستم' : 'مشتری') })
    ]));

    const passBox = h('div', { class: 'table-wrap' }, h('div', { class: 'modal-body' }, [
      h('div', { class: 'p-title', text: 'تغییر گذرواژه' }),
      h('br'),
      field('گذرواژه فعلی', curP),
      h('div', { class: 'form-row' }, [
        field('گذرواژه جدید', newP),
        field('تکرار گذرواژه جدید', newP2)
      ]),
      h('button', { class: 'btn btn-outline', type: 'button', text: 'تغییر گذرواژه', onclick: savePass })
    ]));

    function field(label, input) {
      return h('div', { class: 'p-field' }, [h('label', { text: label }), input]);
    }
    async function saveProfile() {
      const res = LNS.updateProfile(user.id, { name: nameI.value, phone: phoneI.value, email: emailI.value });
      if (!res.ok) { toast(res.error, 'err'); return; }
      toast('پروفایل به‌روزرسانی شد.', 'ok');
      setTimeout(() => location.reload(), 700);
    }
    async function savePass() {
      if (newP.value !== newP2.value) { toast('تکرار گذرواژه مطابقت ندارد.', 'err'); return; }
      const res = await LNS.changePassword(user.id, curP.value, newP.value);
      if (!res.ok) { toast(res.error, 'err'); return; }
      curP.value = newP.value = newP2.value = '';
      toast('گذرواژه با موفقیت تغییر کرد.', 'ok');
    }

    return h('div', {}, [
      head('پروفایل من', 'اطلاعات حساب کاربری خود را مدیریت کنید'),
      info, h('br'), passBox
    ]);
  }

  /* ── رندر مرکزی ───────────────────────────────────────── */
  const views = { dash: viewDash, quotes: viewQuotes, msgs: viewMsgs, favs: viewFavs, profile: viewProfile };

  function render(view) {
    main.textContent = '';
    main.appendChild(views[view]());
  }

  function counters() {
    const q = myQ().length, m = myM().length, f = favList().length;
    setCount('#cQuotes', q); setCount('#cMsgs', m); setCount('#cFavs', f);
    function setCount(sel, n) {
      const el = $(sel);
      el.hidden = !n;
      el.textContent = faNum(n);
    }
  }

  render('dash');
  counters();
  LNS.onSync(() => { counters(); });
})();
