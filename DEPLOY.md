# راهنمای انتشار — هاست اشتراکی PHP + MySQL

> پیش‌نیاز: PHP 8.1+ (با `pdo_mysql` و `mbstring`)، MySQL 5.7+، `mod_rewrite`، SSL.

## ۱. آپلود فایل‌ها
- کل پوشه سایت را via SFTP/FTP در `public_html` (یا ساب‌فولدر `/line`) آپلود کنید.
- `api/.data.sqlite*` را آپلود **نکنید** (فقط تست محلی).

## ۲. دیتابیس
1. در cPanel → MySQL Databases: دیتابیس `linenory` + کاربر + رمز قوی بسازید و کاربر را به دیتابیس وصل کنید.
2. در phpMyAdmin → Import → فایل `api/setup.sql` را ایمپورت کنید (۸ جدول + ۱۲ محصول + تنظیمات TODO).

## ۳. پیکربندی بک‌اند
```bash
cp api/config.example.php api/config.php
```
- `DB_HOST` (معمولاً `localhost`)، `DB_NAME`، `DB_USER`، `DB_PASS` واقعی.
- سکرت‌ها (هر کدام ۶۴ هگز):
```bash
openssl rand -hex 32   # → SESSION_SECRET
openssl rand -hex 32   # → CSRF_SECRET
```
- `APP_ENV = 'production'`. ⚠️ `api/config.php` هرگز در گیت نرود (در `.gitignore` هست).

## ۴. دسترسی‌ها
- فایل‌ها `644`، پوشه‌ها `755`؛ `api/config.php` ترجیحاً `600`.
- نیازی به پوشه uploads نیست (آپلود فایل نداریم).

## ۵. `.htaccess`
- `api/.htaccess` سر جایش باشد؛ در cPanel بررسی کنید `mod_rewrite` فعال و AllowOverride برقرار است.
- هدرهای HSTS فقط با HTTPS فعال می‌مانند (روی http تست نکنید).

## ۶. دامنه + SSL
- دامنه را به `public_html` (یا `/line`) پوینت کنید؛ Let's Encrypt از cPanel فعال کنید.
- بعد از SSL، `SITE.DOMAIN/BASE_URL` و canonical ها را با دامنه واقعی چک کنید.

## ۷. تست بک‌اند
- `GET https://DOMAIN/api/health` → `{"ok":true,...}` (اگر `/api` rewrite نشد، لاگ خطای آپاچی را ببینید).

## ۸. ثبت اولین ادمین
- به `auth.html` بروید و ثبت‌نام کنید — **اولین کاربر خودکار ادمین** می‌شود.
- بلافاصله از پنل ادمین → تنظیمات: تلفن/واتساپ/ایمیل واقعی + تغییر گذرواژه.

## ۹. کانفیگ فرانت
- `js/config.js`: همه TODOها (جدول راهنمای README) + choix: لینک‌های `wa.me/tel/mailto` خودکار تزریق می‌شوند.

## ۱۰. تست جریان کامل
1. ورود مشتری → فروشگاه → سبد → ثبت استعلام → پنل کاربری (وضعیت `جدید`)
2. ورود ادمین → استعلام‌ها → صدور پیش‌فاکتور → مشتری وضعیت `invoice` را می‌بیند
3. پیام مشتری → پاسخ ادمین

## ۱۱. بکاپ
- هفتگی: دامپ MySQL (`mysqldump`) + فایل‌ها. نگهداری ۴ نسخه اخیر.
- قبل از هر آپدیت: بکاپ + تست restore سالی یک‌بار.

## عیب‌یابی
| علامت | علت محتمل |
|---|---|
| 500 روی `/api/*` | `config.php` ناقص / pdo_mysql غیرفعال — لاگ `error_log` |
| 404 روی `/api/*` | rewrite کار نمی‌کند — AllowOverride / مسیر `.htaccess` |
| CSRF 403 مکرر | کوکی third-party بلاکه / ساعت سرور — SameSite=Strict هم‌مبدا نگه دارید |
| 429 | نرخ‌محدود طبیعی؛ ۵ دقیقه صبر یا IP را چک کنید |
