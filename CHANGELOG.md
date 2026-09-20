# تاریخچه تغییرات — لاین نوری استار

## Phase 1 — Security hardening (`3dbd9bd`)
- حذف گذرواژه هاردکد ادمین (`Lns@1404`)؛ اولین ثبت‌نام = ادمین (`needsSetup`)
- SHA-256 تک‌ضربه → PBKDF2-SHA256 با ۱۰۰هزار تکرار + ارتقای خودکار هش قدیمی؛ اسکیما v1→v2
- `js/config.js` مرکزی با TODO؛ `main.js` از کانفیگ می‌خواند؛ README کامل + sitemap به‌روز

## Phase 2 — Backend scaffold (`3d72737`, `feat/backend-scaffold`)
- `/api/`: روتر فرانت‌کنترلر، ۱۵ استاب ۵۰۱، `setup.sql` (۸ جدول + سید)، `.htaccess` امنیتی، `config.example.php`

## Phase 3 — Backend implementation (`e1eb899`, `feat/backend-impl`)
- `lib/`: db (MySQL/SQLite)، auth (نشست چرخشی، CSRF، Argon2id، JWT)، response/validate/rate_limit/audit
- ۱۵ اندپوینت واقعی + تست curl کامل (register→login→quote→admin)

## Phase 4 — Frontend migration (`0857b30`, `feat/frontend-migration`)
- `js/api.js` (API-first + کش ۵دقیقه‌ای + صف آفلاین)، `GET /auth/me`
- صفحات auth/products/dashboard/admin به API مهاجرت کردند؛ تزریق تماس از CONFIG؛ سرویس‌ورکر

## Phase 5 — 3D & UI/UX polish (`4f549ee`, `feat/3d-polish`)
- نور/متریال واقعی‌تر هیرو و استودیو، کانفیگوراتور طول (۱/۲/۳/۵م + قیمت/مصرف)، گذار محو، پینچ/دابل‌تپ/سوایپ
- تم روشن/تیره بدون FOUC، اسکلت + بنر خطا، aria-pressed، reduced-motion سراسری

## Phase 6 — SEO & performance (`92b6c0e`, `feat/seo-perf`)
- اسکیمای Organization، hreflang، theme-color دوقلو، `products.html` Breadcrumb/WebPage
- `GET /sitemap` داینامیک، robots با `/api/`، تنبل‌بارگذاری Three.js، srcset/decoding، SW network-first + `offline.html`

## Phase 7 — Integration test (`66e6ee2`, `feat/integration-test`)
- `tests/phase7.sh`: **۲۴/۲۴ PASS**
- 🐛 باگ واقعی: ذخیره خام `<script>` در نام محصول → `lns_clean()` سروری روی همه ورودی‌های متنی

## Phase 8 — Merge & handoff (this release)
- مرج هر ۶ شاخه در main با merge-commit؛ README نهایی؛ `DEPLOY.md`؛ همین فایل
