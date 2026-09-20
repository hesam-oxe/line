<?php
/* ═══ لاین نوری استار — اعتبارسنجی ورودی ═══
   همه ورودی‌ها اینجا بررسی می‌شوند؛ هیچ اعتمادی به کلاینت نیست. */
declare(strict_types=1);

function lns_fa2en(string $s): string
{
    $fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    $ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    $en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return str_replace(array_merge($fa, $ar), array_merge($en, $en), $s);
}

function lns_norm_phone(string $p): string
{
    $p = lns_fa2en(trim($p));
    $p = str_replace([' ', '-', '(', ')'], '', $p);
    $p = preg_replace('/^\+98/', '0', $p) ?? $p;
    $p = preg_replace('/^98(?=9)/', '0', $p) ?? $p;
    return $p;
}

function lns_is_phone(string $p): bool
{
    return (bool) preg_match('/^09\d{9}$/', lns_norm_phone($p));
}

function lns_is_email(string $e): bool
{
    $e = trim($e);
    if (strlen($e) > 160) {
        return false;
    }
    return (bool) filter_var($e, FILTER_VALIDATE_EMAIL);
}

/* رشته تمیز با طول مجاز؛ null = نامعتبر */
function lns_str(mixed $v, int $min, int $max): ?string
{
    $s = trim((string) ($v ?? ''));
    $len = mb_strlen($s, 'UTF-8');
    if ($len < $min || $len > $max) {
        return null;
    }
    return $s;
}

/* عدد صحیح در بازه؛ null = نامعتبر */
function lns_int(mixed $v, int $min, int $max): ?int
{
    $s = lns_fa2en(trim((string) ($v ?? '')));
    if (!preg_match('/^-?\d+$/', $s)) {
        return null;
    }
    $n = (int) $s;
    if ($n < $min || $n > $max) {
        return null;
    }
    return $n;
}

function lns_enum(mixed $v, array $allowed): ?string
{
    $s = trim((string) ($v ?? ''));
    return in_array($s, $allowed, true) ? $s : null;
}

/* گذرواژه: حداقل ۸ کاراکتر + ۱ بزرگ + ۱ کوچک + ۱ رقم */
function lns_password_error(string $p): ?string
{
    if (mb_strlen($p, 'UTF-8') < 8) {
        return 'گذرواژه باید حداقل ۸ کاراکتر باشد.';
    }
    if (!preg_match('/[A-Z]/', $p)) {
        return 'گذرواژه باید حداقل یک حرف بزرگ انگلیسی داشته باشد.';
    }
    if (!preg_match('/[a-z]/', $p)) {
        return 'گذرواژه باید حداقل یک حرف کوچک انگلیسی داشته باشد.';
    }
    if (!preg_match('/\d/', $p)) {
        return 'گذرواژه باید حداقل یک رقم داشته باشد.';
    }
    return null;
}

function lns_slug(string $name): string
{
    $s = trim(mb_strtolower($name, 'UTF-8'));
    $s = preg_replace('/[^\p{L}\p{N}]+/u', '-', $s) ?? '';
    $s = trim($s, '-');
    return mb_substr($s === '' ? 'item' : $s, 0, 100, 'UTF-8');
}

/* سانیتایز ضدXSS (دفاع لایه‌ای؛ خروجی textContent هم امن است) */
function lns_clean(mixed $v, int $max): string
{
    $s = (string) ($v ?? '');
    $s = str_replace(['<', '>', '`', '\\', '{', '}', '$'], '', $s);
    $s = trim(preg_replace('/\s+/u', ' ', $s) ?? '');
    return mb_substr($s, 0, $max, 'UTF-8');
}
