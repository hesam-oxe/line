<?php
/* ═══ لاین نوری استار — اتصال PDO (MySQL تولیدی + SQLite محلی) ═══
   تولید: api/config.php را از روی config.example.php بسازید (MySQL).
   محلی/تست: بدون config.php، خودکار SQLite در api/.data.sqlite.
   همه کوئری‌ها باید prepared باشند. */
declare(strict_types=1);

function lns_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfgFile = __DIR__ . '/../config.php';
    if (is_file($cfgFile)) {
        require_once $cfgFile;
    }

    $useMysql = defined('DB_HOST') && defined('DB_NAME')
        && !str_starts_with((string) DB_HOST, 'TODO_');

    if ($useMysql) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME
            . ';charset=' . (defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4');
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    }

    // ── حالت محلی: SQLite ──
    $file = __DIR__ . '/../.data.sqlite';
    $fresh = !is_file($file);
    $pdo = new PDO('sqlite:' . $file, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
    if ($fresh) {
        lns_sqlite_init($pdo);
    }
    return $pdo;
}

function lns_is_sqlite(PDO $pdo): bool
{
    return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
}

function lns_uuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

/* زمان میلی‌ثانیه (سازگار با Date.now فرانت) */
function lns_now_ms(): int
{
    return (int) round(microtime(true) * 1000);
}

/* اسکیمای SQLite معادل setup.sql (بدون ENUM/AUTO_INCREMENT) */
function lns_sqlite_init(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer', status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL, last_login INTEGER NOT NULL DEFAULT 0)");
    $pdo->exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL, expires_at INTEGER NOT NULL, ip TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL)");
    $pdo->exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_token ON sessions(token)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL, name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '', price INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'mono', image TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)");
    $pdo->exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_products_slug ON products(slug)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL DEFAULT '', quantity INTEGER NOT NULL DEFAULT 1,
      message TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new',
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, from_user TEXT NOT NULL DEFAULT '', to_user TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL, product_id TEXT NOT NULL, created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, product_id))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '')");
    $pdo->exec("CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL)");

    $seed = [
        ['00000000-0000-4000-8000-000000000001', 'line-220v-mono-64led', 'لاین نوری ۲۲۰ولت تک‌رنگ ۶۴LED', 'لاین استاندارد ۲۲۰ولت، مناسب سقف کاذب و روسری', 185000, 'mono', '', 140],
        ['00000000-0000-4000-8000-000000000002', 'line-12v-2835', 'لاین نوری ۱۲ولت ۲۸۳۵ مخفی', 'نور یکنواخت کابینت و قفسه', 128000, 'mono', '', 220],
        ['00000000-0000-4000-8000-000000000003', 'line-cabinet-sensor', 'لاین نوری کابینت با حسگر حرکت', 'روشن‌شدن خودکار با درب کابینت', 480000, 'mono', '', 65],
        ['00000000-0000-4000-8000-000000000004', 'line-rgb-remote', 'لاین نوری RGB کنترل‌دار', '۱۶ میلیون رنگ با ریموت لمسی', 345000, 'rgb', '', 98],
        ['00000000-0000-4000-8000-000000000005', 'line-ws2811', 'لاین نوری آدرس‌پذیر WS2811', 'کنترل مستقل هر سگمنت', 890000, 'rgb', '', 40],
        ['00000000-0000-4000-8000-000000000006', 'line-rgbw', 'لاین نوری RGBW چهارموتوره', 'کانال سفید مستقل + RGB', 590000, 'rgbw', '', 52],
        ['00000000-0000-4000-8000-000000000007', 'line-cob-384led', 'لاین نوری COB یکدست ۳۸۴LED', 'خط پیوسته بدون نقطه', 720000, 'cob', '', 74],
        ['00000000-0000-4000-8000-000000000008', 'neon-flex-12v-ip67', 'نئون فلکس ۱۲ولت IP67', 'ضد باران، مناسب نما', 640000, 'cob', '', 88],
        ['00000000-0000-4000-8000-000000000009', 'profile-hidden-2m', 'پروفیل آلومینیومی مخفی ۲متری', 'دفع حرارت + روکش اپال', 195000, 'profile', '', 300],
        ['00000000-0000-4000-8000-000000000010', 'profile-corner', 'پروفیل گوشه‌ای کابینت', 'زاویه ۴۵ درجه بدون خیرگی', 165000, 'profile', '', 260],
        ['00000000-0000-4000-8000-000000000011', 'driver-12v-15a', 'درایور سوئیچینگ ۱۲ولت ۱۵آمپر', 'خروجی پایدار تا ۱۵ متر', 385000, 'driver', '', 120],
        ['00000000-0000-4000-8000-000000000012', 'remote-rgb-touch', 'ریموت کنترل RGB لمسی + بلوتوث', 'چرخ رنگ لمسی + اپ موبایل', 260000, 'driver', '', 150],
    ];
    $now = lns_now_ms();
    $st = $pdo->prepare('INSERT OR IGNORE INTO products (id,slug,name,description,price,category,image,stock,created_at) VALUES (?,?,?,?,?,?,?,?,?)');
    foreach ($seed as $r) {
        $st->execute([...$r, $now]);
    }
    $cfg = [
        ['phone', 'TODO_PHONE_DISPLAY__example__09123456789'],
        ['whatsapp', 'TODO_WHATSAPP__example__989123456789'],
        ['email', 'TODO_EMAIL__example__info@example.ir'],
        ['address', 'TODO_ADDRESS__example__تهران'],
    ];
    $st = $pdo->prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)');
    foreach ($cfg as $r) {
        $st->execute($r);
    }
}
