<?php
/* ═══ لاین نوری استار — استاب: ثبت‌نام کاربر (/auth/register) ═══
   وضعیت فاز ۲: فقط ۵۰۱ Not Implemented. منطق در فاز ۳.
   فاز ۳: اعتبارسنجی نام/موبایل/ایمیل + هش Argon2id + درج users + لاگ audit.
   امنیت فاز ۳: PDO prepared + CSRF + rate-limit + نشست چرخشی. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode([
    'ok' => false,
    'error' => 'پیاده‌سازی نشده (Not Implemented).',
    'endpoint' => '/auth/register',
    'phase' => 2,
], JSON_UNESCAPED_UNICODE);
