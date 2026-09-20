<?php
/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — نمونه پیکربندی بک‌اند (PHP + MySQL)
   این فایل را به config.php کپی کنید و مقادیر واقعی را وارد کنید:
     cp config.example.php config.php
   config.php در گیت نسخه نمی‌شود (.gitignore). هیچ سکرت واقعی
   در این فایل نمونه قرار ندهید — فقط TODO.
   ═══════════════════════════════════════════════════════════ */
declare(strict_types=1);

// ── محیط اجرا: local | production ──
const APP_ENV = 'local';

// ── پایگاه داده (MySQL) — TODO: مقادیر واقعی سرور محلی ──
const DB_HOST = 'TODO_DB_HOST__example__127.0.0.1';
const DB_NAME = 'TODO_DB_NAME__example__linenory';
const DB_USER = 'TODO_DB_USER__example__linenory_user';
const DB_PASS = 'TODO_DB_PASS__example__change-me';
const DB_CHARSET = 'utf8mb4';

// ── سکرت‌ها — TODO: با openssl rand -hex 32 تولید کنید ──
const SESSION_SECRET = 'TODO_SESSION_SECRET__generate__openssl-rand-hex-32';
const CSRF_SECRET = 'TODO_CSRF_SECRET__generate__openssl-rand-hex-32';

// ── نشست ──
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // ۷ روز

// ── محدودیت نرخ (پیش‌فرض) ──
const RATE_LIMIT_AUTH_PER_MIN = 10;

// ── اتصال PDO (فاز ۳ استفاده می‌شود) ──
function lns_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}
