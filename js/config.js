/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — پیکربندی مرکزی سایت (فرانت‌اند)
   همه مقادیر واقعی را اینجا وارد کنید. هیچ سکرتی در فایل‌های
   دیگر هاردکد نکنید. این فایل در گیت نسخه می‌شود، پس فقط
   اطلاعات عمومی (تلفن/ایمیل/دامنه) — نه گذرواژه و نه کلید.
   مقادیر TODO را قبل از انتشار نهایی جایگزین کنید.
   ═══════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const TODO = (name) => 'TODO_' + name;

  window.LNS_CONFIG = Object.freeze({
    SITE: Object.freeze({
      NAME_FA: 'لاین نوری استار',
      NAME_EN: 'Linenory Star',
      // TODO: دامنه نهایی، مثال: https://example.ir/line/
      DOMAIN: TODO('DOMAIN__example__https://example.ir'),
      BASE_URL: TODO('BASE_URL__example__https://example.ir/line'),
      LOCALE: 'fa_IR',
      LANG: 'fa',
      THEME_COLOR: '#0a0a12'
    }),
    CONTACT: Object.freeze({
      // TODO: شماره نمایشی، مثال: 09123456789
      PHONE_DISPLAY: TODO('PHONE_DISPLAY__example__09123456789'),
      // TODO: لینک tel بدون فاصله، مثال: +989123456789
      PHONE_LINK: TODO('PHONE_LINK__example__+989123456789'),
      // TODO: شماره واتساپ با کد کشور بدون +، مثال: 989123456789
      WHATSAPP: TODO('WHATSAPP__example__989123456789'),
      // TODO: ایمیل عمومی
      EMAIL: TODO('EMAIL__example__info@example.ir'),
      // TODO: آدرس فیزیکی
      ADDRESS: TODO('ADDRESS__example__تهران'),
      INSTAGRAM: ''
    }),
    // ایمیل پیش‌فرض مدیر برای راه‌اندازی اولیه (گذرواژه اینجا نیست)
    // گذرواژه ادمین هرگز در کد ذخیره نمی‌شود — در اولین اجرا ساخته می‌شود.
    ADMIN_EMAIL: TODO('ADMIN_EMAIL__example__admin@example.ir'),
    API: Object.freeze({
      // پایه API بک‌اند PHP. خالی = همان‌مبدا (/api/).
      // در تست محلی (فرانت :8000 + بک‌اند :8001) خودکار localhost:8001.
      BASE: ''
    })
  });
})();
