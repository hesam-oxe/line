# ✦ لاین نوری استار — Linenory-Star

> **نور، امضای فضای شما** — وب‌سایت رسمی طراحی، تأمین و اجرای سیستم‌های لاین نوری LED

لندینگ تک‌صفحه‌ای سینمایی با صحنه‌ی سه‌بعدی زنده، شبیه‌ساز رنگ نور، معماری کامل RTL فارسی
و سطح امنیت و سئوی حرفه‌ای.

**🔗 نسخه زنده:** https://hesam-oxe.github.io/line/

---

## ✨ امکانات

### 🎬 ظاهر و تجربه کاربری
- صحنه سه‌بعدی **Three.js** در هیرو: ۱۶ خط نور شناور + ۸۰۰ ذره + افکت **UnrealBloom** + پارالکس موس + حرکت دوربین با اسکرول
- **شبیه‌ساز رنگ نور**: دکمه‌های ۶۵۰۰K / ۴۵۰۰K / ۳۰۰۰K / RGB رنگین‌کمانی + اسلایدر شدت نور — با ترنزیشن نرم
- **پری‌لودر سینمایی** با نوار پیشرفت نئونی و ریویل clip-path
- **کرسر سفارشی گلو** (دات آبی + حلقه طلایی با واکنش به عناصر تعاملی)
- **دکمه‌های مغناطیسی** و **تیلت سه‌بعدی** کارت‌ها با GSAP
- نوار **مارکی کلمات کلیدی**، انیمیشن Reveal اسکرول، شمارنده‌های فارسی متحرک
- **لایت‌باکس** گالری با ناوبری کیبورد (سازگار با RTL)، توست‌های شیشه‌ای، دکمه بازگشت به بالا با **حلقه پیشرفت اسکرول**
- احترام کامل به `prefers-reduced-motion` + فالبک بدون جاوااسکریپت (`noscript.css`)

### 🔐 امنیت
- **CSP سخت‌گیرانه** بدون هیچ inline script/style — کل کد از فایل‌های محلی سرو می‌شود
- **صفر وابستگی به CDN خارجی**: Three.js، GSAP و فونت وزیرمتن (متغیر) همگی وندور محلی شده‌اند (`js/vendor/`, `assets/fonts/`)
- فرم مشاوره با **Honeypot** (تله ربات)، **Rate-limit** (یک ارسال در ۳۰ ثانیه)، **سانیتایز ورودی** و اعتبارسنجی شماره موبایل ایرانی
- همه لینک‌های خارجی با `rel="noopener noreferrer"` + متای `referrer` و `_headers` کامل برای مهاجرت به Cloudflare/Netlify

### 🚀 سئو و عملکرد
- متادیتای کامل: Title، Description، Canonical، **Open Graph** (با تصویر اختصاصی ۱۲۰۰×۶۳۰) و **Twitter Card**
- **JSON-LD ساختاریافته**: `HomeAndConstructionBusiness` + کاتالوگ ۶ محصول (`OfferCatalog`) + `WebSite`
- `robots.txt`، `sitemap.xml`، `manifest.webmanifest` (PWA-ready)، favicon و آیکون‌های اپ
- HTML سمانتیک، اسکیپ‌لینک، `alt` فارسی برای همه تصاویر، ابعاد مشخص تصاویر (بدون CLS)، فونت پیش‌بارگذاری‌شده
- اسکریپت‌های `defer`، رندر سه‌بعدی موقتاً متوقف خارج از دید، DPR محدود برای موبایل

---

## 📁 ساختار پروژه

```
line/
├── index.html              ← صفحه اصلی (۹ بخش)
├── 404.html                ← صفحه ۴۴۴ سفارشی
├── robots.txt · sitemap.xml
├── manifest.webmanifest
├── _headers                ← هدرهای امنیتی (Cloudflare/Netlify)
├── css/
│   ├── base.css            ← تم پایه: پالت، گلس، دکمه‌ها، هدر، هیرو
│   ├── sections.css        ← شبیه‌ساز، خدمات، محصولات، گالری، فوتر
│   ├── enhance.css         ← لایه EXTREME: پری‌لودر، کرسر، مارکی، توست
│   └── noscript.css        ← فالبک بدون JS
├── js/
│   ├── main.js             ← هسته تعاملی (بدون فریم‌ورک)
│   ├── three-scene.js      ← صحنه هیرو + شبیه‌ساز (ماژول ES)
│   └── vendor/             ← three.module.js + addons + gsap (محلی)
└── assets/
    ├── favicon.svg · fonts/Vazirmatn-Variable.woff2
    ├── icons/              ← PWA + apple-touch
    └── img/og-cover.jpg    ← کاور شبکه‌های اجتماعی
```

## ⚙️ تنظیمات سریع

| مورد | محل تغییر |
|---|---|
| شماره واتساپ | ثابت `WHATSAPP` در `js/main.js` + لینک‌های `wa.me` در `index.html` |
| شماره تلفن نمایشی | جستجوی `۰۹۱۲ ۱۲۳ ۴۵۶۷` در `index.html` |
| ایمیل و آدرس | بخش فوتر در `index.html` + JSON-LD |
| رنگ تم | متغیرهای `:root` در `css/base.css` |
| شدت بلوم و تعداد خطوط نور | `js/three-scene.js` |

## 🛠 تکنولوژی

`HTML5` · `CSS3` (Glassmorphism + Custom Properties) · `Vanilla JS` · `Three.js 0.160` (ES Modules — local vendored) · `GSAP 3.12 + ScrollTrigger` · `Vazirmatn Variable Font`

---

© ۱۴۰۴ لاین نوری استار — تمامی حقوق محفوظ است.
