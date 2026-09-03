/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — ابزارهای مشترک UI (ضد XSS)
   قاعده: هرگز innerHTML با داده کاربر — همه‌چیز با textContent
   ═══════════════════════════════════════════════════════════ */
'use strict';

(function () {
  /* سازنده امن المان: h('div', {class:'x', onclick:fn}, [children]) */
  function h(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;             /* فقط برای markup ثابت داخلی */
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k in el && typeof v === 'string') { try { el[k] = v; } catch (_) { el.setAttribute(k, v); } }
        else el.setAttribute(k, v);
      }
    }
    if (children) {
      const frag = document.createDocumentFragment();
      for (const c of [].concat(children)) {
        if (c == null || c === false) continue;
        frag.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
      el.appendChild(frag);
    }
    return el;
  }

  /* ارقام فارسی */
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const faNum = (n) => String(n).replace(/\d/g, d => FA[d]);

  /* قیمت تومانی */
  const money = (t) => faNum(Number(t || 0).toLocaleString('en-US')) + ' تومان';

  /* تاریخ فارسی */
  const faDate = (ts) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(ts));
    } catch (_) { return faNum(new Date(ts).toLocaleDateString()); }
  };
  const faTime = (ts) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
    } catch (_) { return ''; }
  };
  const relTime = (ts) => {
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    if (m < 1) return 'همین حالا';
    if (m < 60) return faNum(m) + ' دقیقه پیش';
    const hh = Math.floor(m / 60);
    if (hh < 24) return faNum(hh) + ' ساعت پیش';
    const dd = Math.floor(hh / 24);
    if (dd < 30) return faNum(dd) + ' روز پیش';
    return faDate(ts);
  };

  /* توست سراسری */
  let toastWrap = null;
  function toast(msg, type) {
    if (!toastWrap) {
      toastWrap = h('div', { class: 'toast-wrap', 'aria-live': 'polite' });
      document.body.appendChild(toastWrap);
    }
    const t = h('div', { class: 'toast ' + (type === 'err' ? 'toast-err' : type === 'info' ? 'toast-info' : 'toast-ok') }, [
      h('span', { class: 'toast-dot', 'aria-hidden': 'true' }),
      h('span', { text: msg })
    ]);
    toastWrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 350);
    }, type === 'err' ? 4600 : 3200);
  }

  /* مودال عمومی: openModal({title, body, footer, wide}) → {close} */
  function openModal(opts) {
    const prev = document.activeElement;
    const ov = h('div', { class: 'modal-ov', role: 'dialog', 'aria-modal': 'true' });
    const box = h('div', { class: 'modal-box glass' + (opts.wide ? ' modal-wide' : '') });
    const head = h('div', { class: 'modal-head' }, [
      h('h3', { text: opts.title || '' }),
      h('button', { class: 'modal-x', type: 'button', 'aria-label': 'بستن', text: '×', onclick: close })
    ]);
    const body = h('div', { class: 'modal-body' });
    if (opts.body) body.appendChild(opts.body);
    box.appendChild(head); box.appendChild(body);
    if (opts.footer) box.appendChild(h('div', { class: 'modal-foot' }, [opts.footer]));
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.classList.add('no-scroll');

    function close() {
      ov.classList.remove('open');
      document.body.classList.remove('no-scroll');
      setTimeout(() => ov.remove(), 220);
      if (prev && prev.focus) prev.focus();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    requestAnimationFrame(() => ov.classList.add('open'));
    const focusable = box.querySelector('input, select, textarea, button.btn');
    if (focusable) setTimeout(() => focusable.focus(), 120);
    return { close, box, body };
  }

  /* برچسب وضعیت */
  const badge = (label, tone) => h('span', { class: 'badge badge-' + (tone || 'muted'), text: label });

  /* ردیف جدول امن */
  const cell = (t) => h('td', { text: t == null ? '' : String(t) });

  window.UI = { h, faNum, money, faDate, faTime, relTime, toast, openModal, badge, cell };
})();
