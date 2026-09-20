# لاین نوری استار — API (فاز ۳)

بک‌اند `PHP 8 + PDO` با دو حالت ذخیره‌سازی:

- **تولیدی:** MySQL — از روی `config.example.php` فایل `config.php` بسازید.
- **محلی/تست:** بدون `config.php`، خودکار SQLite در `api/.data.sqlite` (gitignore).

## اجرای محلی

```bash
cd /sec/root/line
php -S localhost:8001 api/index.php
```

## احراز هویت و CSRF

1. `GET /` یا `GET /health` کوکی `lns_csrf` (ناشناس) می‌دهد.
2. همه `POST`ها هدر `X-CSRF-Token` (مقدار کوکی) می‌خواهند.
3. `POST /auth/register` — اولین کاربر `admin` می‌شود.
4. نشست در کوکی `HttpOnly/SameSite=Strict` (`lns_session`) + JWT تازه‌سازی در پاسخ.

## مثال curl

```bash
J=/tmp/cj.txt
CSRF=$(curl -s -c $J http://localhost:8001/ -o /dev/null; python3 -c "import http.cookiejar; j=http.cookiejar.MozillaCookieJar('$J'); j.load(); print([c.value for c in j if c.name=='lns_csrf'][0])")

# ثبت‌نام (ادمین اول)
curl -s -b $J -c $J -X POST http://localhost:8001/auth/register \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"name":"مدیر تست","phone":"09123456789","email":"admin@test.ir","pass":"Test1234","pass2":"Test1234"}'

# ورود
curl -s -b $J -c $J -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"identifier":"admin@test.ir","pass":"Test1234"}'
```

## امنیت

- گذرواژه: `Argon2id` — `lib/auth.php`
- CSRF دابل‌سابمیت روی همه POST — `lns_check_csrf()`
- نرخ‌محدود: احراز هویت ۵/۵دقیقه، عمومی ۱۰۰/دقیقه — `lib/rate_limit.php` (فایل‌محور)
- همه کوئری‌ها prepared — `lib/db.php`
- حسابرسی همه نوشتن‌ها — `lib/audit.php`
- خروجی همیشه JSON
