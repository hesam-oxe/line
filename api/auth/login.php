<?php
/* ═══ لاین نوری استار — استاب: ورود با ایمیل یا موبایل (/auth/login) ═══
   وضعیت فاز ۲: فقط ۵۰۱ Not Implemented. منطق در فاز ۳.
   فاز ۳: بررسی password_verify + قفل ۵ تلاش + چرخش نشست + کوکی HttpOnly.
   امنیت فاز ۳: PDO prepared + CSRF + rate-limit + نشست چرخشی. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode([
    'ok' => false,
    'error' => 'پیاده‌سازی نشده (Not Implemented).',
    'endpoint' => '/auth/login',
    'phase' => 2,
], JSON_UNESCAPED_UNICODE);
