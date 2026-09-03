/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — منطق فروشگاه محصولات
   فیلتر · جستجو · مرتب‌سازی · سبد استعلام · علاقه‌مندی · اسکیما
   ═══════════════════════════════════════════════════════════ */
'use strict';

(async function () {

  const { h, money, faNum, toast, openModal } = UI;
  await LNS.ready();

  const $ = (s) => document.querySelector(s);
  const grid = $('#grid'), chipsBox = $('#chips'), qInput = $('#q'),
        sortSel = $('#sort'), countEl = $('#count'),
        quoteBar = $('#quoteBar'), quoteCountEl = $('#quoteCount');

  const state = { cat: 'all', q: '', sort: 'pop' };
  const CART_KEY = 'lns:v1:cart';
  let cart = loadCart();                    /* {productId: qty} */
  const user = LNS.me();

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch (_) { return {}; }
  }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {} };

  /* ── چیپ‌های دسته‌بندی ─────────────────────────────────── */
  const catList = [['all', 'همه محصولات']].concat(Object.entries(LNS.CATS));
  chipsBox.append(...catList.map(([id, label]) =>
    h('button', {
      class: 'chip' + (id === 'all' ? ' on' : ''), type: 'button',
      role: 'tab', 'aria-selected': id === 'all' ? 'true' : 'false',
      text: label,
      onclick: () => {
        state.cat = id;
        chipsBox.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
        chipsBox.querySelector('[data-cat="' + id + '"]').classList.add('on');
        render();
      },
      dataset: { cat: id }
    })
  ));

  qInput.addEventListener('input', () => { state.q = qInput.value.trim(); render(); });
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });

  /* ── منطق داده ────────────────────────────────────────── */
  function filtered() {
    let list = LNS.products().slice();
    if (state.cat !== 'all') list = list.filter(p => p.cat === state.cat);
    if (state.q) {
      const q = LNS.toEn(state.q).toLowerCase();
      list = list.filter(p => (p.name + ' ' + (p.desc || '') + ' ' + p.cat).toLowerCase().includes(q));
    }
    if (state.sort === 'cheap') list.sort((a, b) => a.price - b.price);
    else if (state.sort === 'exp') list.sort((a, b) => b.price - a.price);
    else if (state.sort === 'off') list.sort((a, b) => offPct(b) - offPct(a));
    else list.sort((a, b) => (b.featured - a.featured) || (a.price - b.price));
    return list;
  }
  const offPct = (p) => (p.oldPrice && p.oldPrice > p.price) ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  const isFav = (id) => user && LNS.favs(user.id).includes(id);

  function toggleFav(id, btn) {
    if (!user) {
      toast('برای ذخیره علاقه‌مندی‌ها ابتدا وارد حساب شوید.', 'info');
      setTimeout(() => location.href = 'auth.html?next=' + encodeURIComponent('products.html'), 900);
      return;
    }
    const added = LNS.toggleFav(user.id, id);
    btn.classList.toggle('on', added);
    toast(added ? 'به علاقه‌مندی‌ها اضافه شد.' : 'از علاقه‌مندی‌ها حذف شد.', added ? 'ok' : 'info');
  }

  /* ── کارت محصول ───────────────────────────────────────── */
  const heartSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S3.5 15.4 3.5 9.6C3.5 6.9 5.6 5 8.1 5c1.5 0 3 .8 3.9 2 .9-1.2 2.4-2 3.9-2 2.5 0 4.6 1.9 4.6 4.6 0 5.8-8.5 10.9-8.5 10.9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  function card(p) {
    const off = offPct(p);
    const colors = (p.colors && p.colors.length ? p.colors : [p.glow]);
    const addBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', text: cart[p.id] ? 'در سبد (' + faNum(cart[p.id]) + ')' : 'افزودن به استعلام', onclick: () => addToCart(p.id) });
    const detBtn = h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'جزئیات', onclick: () => detail(p) });

    const cardEl = h('article', { class: 'prod-card' }, [
      h('div', { class: 'prod-visual', dataset: { glow: p.glow } }, [
        h('button', {
          class: 'prod-fav' + (isFav(p.id) ? ' on' : ''), type: 'button',
          'aria-label': 'افزودن به علاقه‌مندی‌ها', html: heartSvg,
          onclick: (e) => { e.currentTarget.blur(); toggleFav(p.id, e.currentTarget); }
        }),
        p.badge ? h('span', { class: 'prod-badge', text: p.badge }) : null,
        off ? h('span', { class: 'prod-off', text: faNum(off) + '٪ تخفیف' }) : null,
        h('div', { class: 'strip', 'aria-hidden': 'true' })
      ]),
      h('div', { class: 'prod-body' }, [
        h('h2', { class: 'prod-name', text: p.name }),
        p.desc ? h('p', { class: 'prod-desc', text: p.desc }) : null,
        h('div', { class: 'prod-specs' }, [
          p.watt !== '—' ? h('span', { class: 'spec', text: p.watt }) : null,
          p.ip !== '—' ? h('span', { class: 'spec', text: p.ip }) : null,
          p.volt !== '—' ? h('span', { class: 'spec', text: p.volt }) : null,
          p.warranty ? h('span', { class: 'spec', text: 'ضمانت ' + faNum(p.warranty) + ' ماه' }) : null
        ]),
        colors.length > 1 ? h('div', { class: 'prod-colors' }, colors.map(c =>
          h('span', { class: 'swatch', 'aria-hidden': 'true' })
        )) : null,
        h('div', { class: 'prod-price-row' }, [
          h('div', { class: 'prod-price' }, [
            p.oldPrice > p.price ? h('s', { text: money(p.oldPrice) }) : null,
            h('b', { text: money(p.price) }),
            h('span', { class: 'per', text: 'هر متر' })
          ])
        ]),
        h('div', { class: 'prod-actions' }, [detBtn, addBtn])
      ])
    ]);
    /* رنگ گلو داینامیک — فقط از طریق CSSOM (سازگار با CSP) */
    cardEl.style.setProperty('--pc', p.glow || '#FFC966');
    const swatches = cardEl.querySelectorAll('.swatch');
    swatches.forEach((s, i) => s.style.color = colors[i] || p.glow);
    return cardEl;
  }

  /* ── مودال جزئیات ─────────────────────────────────────── */
  function detail(p) {
    const colors = (p.colors && p.colors.length ? p.colors : [p.glow]);
    const body = h('div', {}, [
      h('div', { class: 'pd-visual' }, [
        h('div', { class: 'strip', 'aria-hidden': 'true' }),
        h('div', { class: 'pd-swatches', role: 'group', 'aria-label': 'رنگ نور' },
          colors.map((c, i) => h('button', {
            type: 'button', 'aria-label': 'رنگ ' + faNum(i + 1),
            onclick: (e) => { e.currentTarget.closest('.modal-box').style.setProperty('--pc', c); }
          }))
        )
      ]),
      h('table', { class: 'pd-specs' }, [
        row('نام محصول', p.name),
        row('دسته', (LNS.CATS[p.cat] || p.cat)),
        row('قیمت هر متر', money(p.price)),
        p.oldPrice > p.price ? row('قیمت قبل از تخفیف', money(p.oldPrice)) : null,
        p.watt !== '—' ? row('توان', p.watt) : null,
        p.ip !== '—' ? row('استاندارد ضدآب', p.ip) : null,
        p.volt !== '—' ? row('ولتاژ', p.volt) : null,
        p.warranty ? row('ضمانت', faNum(p.warranty) + ' ماه') : null,
        row('موجودی', p.stock > 0 ? faNum(p.stock) + ' متر آماده ارسال' : 'ناموجود — استعلام تلفنی')
      ]),
      h('p', { class: 'pd-desc', text: p.desc || '' })
    ]);
    const m = openModal({
      title: p.name, wide: true, body,
      footer: h('button', { class: 'btn btn-primary', type: 'button', text: 'افزودن به سبد استعلام', onclick: () => { addToCart(p.id); m.close(); } })
    });
    m.box.style.setProperty('--pc', p.glow || '#FFC966');
    const sws = m.box.querySelectorAll('.pd-swatches button');
    sws.forEach((b, i) => b.style.color = colors[i] || p.glow);

    function row(k, v) { return h('tr', {}, [h('td', { text: k }), h('td', { text: v })]); }
  }

  /* ── سبد استعلام ──────────────────────────────────────── */
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    syncQuoteBar();
    toast('به سبد استعلام اضافه شد.', 'ok');
    render();
  }

  function quoteItems() {
    return Object.entries(cart)
      .map(([pid, qty]) => {
        const p = LNS.product(pid);
        return {
          productId: pid,
          name: p ? p.name : '',
          price: p ? p.price : 0,
          glow: p ? (p.glow || '#FFC966') : '#9AA3B8',
          qty: qty
        };
      })
      .filter(x => x.name);
  }

  function syncQuoteBar() {
    const items = quoteItems();
    const n = items.reduce((s, x) => s + x.qty, 0);
    quoteCountEl.textContent = n ? 'سبد استعلام: ' + faNum(n) + ' قلم' : 'سبد استعلام';
    quoteBar.classList.toggle('show', n > 0);
    $('#openQuote').textContent = n ? 'ثبت درخواست پیش‌فاکتور (' + faNum(n) + ')' : 'ثبت درخواست پیش‌فاکتور';
  }

  $('#openQuote').addEventListener('click', openQuoteModal);

  function openQuoteModal() {
    const items = quoteItems();
    if (!items.length) { toast('سبد استعلام خالی است.', 'info'); return; }

    const list = h('div', {});
    items.forEach(it => {
      const nameBox = h('div', { class: 'q-name' }, [
        h('span', { text: it.name }),
        h('small', { text: money(it.price) + ' / متر' })
      ]);
      const qtyB = h('b', { text: faNum(it.qty) });
      const row = h('div', { class: 'q-item' }, [
        h('span', { class: 'q-dot', 'aria-hidden': 'true' }),
        nameBox,
        h('div', { class: 'qty' }, [
          h('button', { type: 'button', 'aria-label': 'کاهش', text: '−', onclick: () => bump(it.productId, -1) }),
          qtyB,
          h('button', { type: 'button', 'aria-label': 'افزایش', text: '+', onclick: () => bump(it.productId, +1) })
        ]),
        h('button', { class: 'q-x', type: 'button', 'aria-label': 'حذف', text: '×', onclick: () => { delete cart[it.productId]; saveCart(); refresh(true); } })
      ]);
      row.style.color = it.glow || '#FFC966';
      nameBox.style.color = '';                     /* متن با رنگ پیش‌فرض بماند */
      function bump(id, d) {
        cart[id] = Math.min(999, Math.max(0, (cart[id] || 0) + d));
        if (!cart[id]) delete cart[id];
        saveCart();
        if (!Object.keys(cart).length) { refresh(true); m.close(); return; }
        qtyB.textContent = faNum(cart[id] || 0);
        if (!cart[id]) row.remove();
        syncQuoteBar();
        render();
      }
      list.appendChild(row);
    });

    const noteEl = h('textarea', { maxlength: 500, placeholder: 'توضیح پروژه ( متراژ، محل نصب، رنگ نور… )', 'aria-label': 'توضیح پروژه' });
    noteEl.classList.add('p-input');
    const body = h('div', {}, [list, noteField()]);

    function noteField() {
      const wrap = h('div', { class: 'p-field' }, [
        h('label', { text: 'توضیح پروژه' }),
        noteEl,
        h('small', { class: 'hint', text: 'اختیاری — این توضیح برای کارشناس ما ارسال می‌شود.' })
      ]);
      return wrap;
    }

    const m = openModal({
      title: 'ثبت درخواست پیش‌فاکتور', wide: true, body,
      footer: h('div', { class: 'td-actions' }, [
        h('button', { class: 'btn btn-outline', type: 'button', text: 'ادامه خرید', onclick: () => m.close() }),
        h('button', { class: 'btn btn-primary', type: 'button', text: 'ارسال درخواست', onclick: submit })
      ])
    });

    async function submit() {
      const u = LNS.me();
      if (!u) {
        toast('برای ثبت استعلام باید وارد حساب شوید.', 'info');
        setTimeout(() => location.href = 'auth.html?next=' + encodeURIComponent('products.html'), 900);
        return;
      }
      const res = LNS.createQuote({
        userId: u.id,
        items: quoteItems().map(x => ({ productId: x.productId, name: x.name, qty: x.qty })),
        note: noteEl.value
      });
      if (!res.ok) { toast(res.error, 'err'); return; }
      cart = {}; saveCart();
      m.close();
      syncQuoteBar(); render();
      toast('استعلام شما ثبت شد! پیگیری در پنل کاربری.', 'ok');
      setTimeout(() => location.href = 'dashboard.html', 1100);
    }
  }

  function refresh(rerender) {
    saveCart(); syncQuoteBar();
    if (rerender) render();
  }

  /* ── ناحیه ورود در هدر ────────────────────────────────── */
  (function authArea() {
    const box = $('#authArea');
    if (user) {
      box.append(
        h('a', { class: 'btn btn-outline btn-sm', href: user.role === 'admin' ? 'admin.html' : 'dashboard.html', text: user.role === 'admin' ? 'پنل مدیریت' : 'پنل من' }),
        h('span', { class: 'user-chip' }, [
          h('span', { class: 'user-avatar', text: (user.name || '?').trim().charAt(0) }),
          h('span', { text: user.name.split(' ')[0] })
        ])
      );
    } else {
      box.append(h('a', { class: 'btn btn-primary btn-sm', href: 'auth.html?next=products.html', text: 'ورود / ثبت‌نام' }));
    }
  })();

  /* ── رندر گرید ────────────────────────────────────────── */
  function render() {
    const list = filtered();
    countEl.textContent = faNum(list.length) + ' محصول';
    grid.textContent = '';
    if (!list.length) {
      const emptyEl = h('div', { class: 'empty' }, [
        h('b', { text: 'محصولی یافت نشد' }),
        h('p', { text: 'عبارت جستجو یا دسته‌بندی را تغییر دهید.' })
      ]);
      emptyEl.style.setProperty('grid-column', '1 / -1');   /* CSSOM — سازگار با CSP */
      grid.append(emptyEl);
      return;
    }
    grid.append(...list.map(card));
  }

  /* ── اسکیمای داینامیک Product/ItemList (همیشه به‌روز) ──── */
  (function schema() {
    const base = 'https://hesam-oxe.github.io/line/products.html';
    const items = LNS.products().slice(0, 20).map((p, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        description: (p.desc || 'لاین نوری استار — ' + (LNS.CATS[p.cat] || '')).slice(0, 220),
        category: LNS.CATS[p.cat] || p.cat,
        image: 'https://hesam-oxe.github.io/line/assets/img/og-cover.jpg',
        brand: { '@type': 'Brand', name: 'لاین نوری استار' },
        offers: {
          '@type': 'Offer',
          url: base,
          priceCurrency: 'IRR',
          price: String(p.price * 10),
          availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
          seller: { '@type': 'Organization', name: 'لاین نوری استار' }
        }
      }
    }));
    const sc = document.createElement('script');
    sc.type = 'application/ld+json';
    sc.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: 'فروشگاه لاین نوری استار', numberOfItems: items.length, itemListElement: items
    });
    document.head.appendChild(sc);
  })();

  render();
  syncQuoteBar();
})();
