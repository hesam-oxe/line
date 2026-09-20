# ✦ لاین نوری استار — Linenory-Star

> **نور، امضای فضای شما** — وب‌سایت رسمی طراحی، تأمین و اجرای سیستم‌های لاین نوری LED (تهران، ایران)

لندینگ سینمایی فارسی‌راست‌چین با **۳ صحنه سه‌بعدی زنده** (Three.js)، شبیه‌ساز رنگ نور با **کانفیگوراتور طول/قیمت**،
**فروشگاه کامل + پنل ادمین + پنل کاربر**، بک‌اند `PHP + MySQL` با نشست امن، تم روشن/تیره، PWA آفلاین و سئوی کامل.

**مخاطب:** مشتریان نورپردازی (مشاهده/استعلام) + مدیر فروشگاه (مدیریت محصولات، استعلام‌ها، کاربران، پیام‌ها).
**نسخه زنده (دمو):** https://hesam-oxe.github.io/line/

---

## ✨ امکانات

### فرانت‌اند
- ۱۴ بخش لندینگ + فروشگاه (`products.html`) با فیلتر/جستجو/مرتب‌سازی، سبد استعلام، علاقه‌مندی
- احراز هویت (`auth.html`)، پنل کاربر (`dashboard.html`)، پنل مدیریت (`admin.html`: داشبورد، CRUD، استعلام‌ها، صندوق پیام، کاربران، تنظیمات)
- ۳ صحنه Three.js (هیرو/شبیه‌ساز/استودیو) با تنبل‌بارگذاری، پینچ‌/درگ/دابل‌تپ/سوایپ و احترام به `prefers-reduced-motion`
- تم روشن/تیره (بدون FOUC)، اسکلت بارگذاری، بنر خطا + تلاش مجدد، توست آفلاین/آنلاین، PWA + سرویس‌ورکر

### بک‌اند (`/api/`, PHP 8 + PDO)
- احراز هویت Argon2id (اولین ثبت‌نام = ادمین)، نشست چرخشی + کوکی HttpOnly/SameSite، JWT تازه‌سازی، CSRF دابل‌سابمیت همه POSTها
- محصولات (خواندن عمومی/نوشتن ادمین)، استعلام‌ها، پیام‌ها، کاربران (ادمین)، نرخ‌محدود (احراز ۵/۵دقیقه، عمومی ۱۰۰/دقیقه)، حسابرسی همه نوشتن‌ها
- MySQL تولیدی + SQLite خودکار محلی؛ `GET /sitemap` داینامیک

### امنیت
- بدون گذرواژه هاردکد؛ PBKDF2-۱۰۰k در دموی محلی قدیمی (v1) با ارتقای خودکار؛ سانی‌تایز `lns_clean` همه ورودی‌های متنی (فاز ۷)
- CSP سخت‌گیرانه، Permissions-Policy، Frame-Bust، Honeypot + Rate-limit فرم، prepared statements، خروجی همیشه JSON

### سئو
- JSON-LD: Business + Organization + WebSite + WebPage + Breadcrumb + FAQ (۷ پرسش) + OfferCatalog؛ ItemList داینامیک فروشگاه
- OG/Twitter، hreflang fa-IR/x-default، theme-color دوقلو، sitemap + robots، srcset/lazy/decoding، فونت swap + preload
- ⚠️ امتیاز ۴.۹/۲۱۳، ساعات کاری و مختصات **قبل از انتشار با کارفرما تأیید شود** (کامنت `TODO(client-verify)` بالای اسکیما)

---

## 🧪 اجرای محلی

```bash
cd /path/to/line
# بک‌اند (حالت روتر — .htaccess روی php -S اعمال نمی‌شود)
php -S localhost:8001 api/index.php
# فرانت (ترمینال دوم)
python3 -m http.server 8000
# http://localhost:8000/index.html
```

تست یکپارچه (۲۴ تست): `bash tests/phase7.sh`

## ⚙️ راهنمای کانفیگ (`js/config.js`)

| کلید | مقدار واقعی |
|---|---|
| `SITE.DOMAIN` / `BASE_URL` | دامنه نهایی، مثال `https://example.ir/line` |
| `CONTACT.PHONE_DISPLAY` | شماره نمایشی `0912…` |
| `CONTACT.PHONE_LINK` | `+98912…` برای `tel:` |
| `CONTACT.WHATSAPP` | بدون `+`، مثال `98912…` |
| `CONTACT.EMAIL` / `ADDRESS` | ایمیل و نشانی واقعی |
| `ADMIN_EMAIL` | ایمیل مدیر اولیه |
| `API.BASE` | خالی = هم‌مبدا؛ در توسعه خودکار `localhost:8001` |

تزریق `wa.me/tel/mailto` فقط با مقادیر واقعی (غیر-TODO) اعمال می‌شود.

## 🚀 چک‌لیست انتشار
1. مقادیر `js/config.js` + `TODO(client-verify)` اسکیما (امتیاز/ساعات/مختصات/نظرات)
2. مراحل `DEPLOY.md` (دیتابیس، `config.php`، SSL، ثبت ادمین اول)
3. حذف `api/.data.sqlite*` از هاست (حالت SQLite فقط محلی)
4. بررسی `/api/health` و یک ثبت‌نام آزمایشی

## 🛠 تکنولوژی
`HTML5` · `CSS3` · `Vanilla JS` · `Three.js 0.160` (lazy) · `GSAP 3.12` · `PHP 8 + PDO (MySQL/SQLite)` · `WebCrypto PBKDF2` · `Argon2id` · `Vazirmatn`

## 📄 مجوز و کردیت
© ۱۴۰۴ لاین نوری استار — تمامی حقوق محفوظ است. توسعه: hesam-oxe.
