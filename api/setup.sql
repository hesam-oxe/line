-- ═══════════════════════════════════════════════════════════
-- لاین نوری استار — اسکیمای MySQL (فاز ۲: اسکافولد)
-- اجرا: mysql -u root -p < api/setup.sql
-- نکته: هیچ گذرواژه‌ای seed نمی‌شود. کاربر ادمین در فاز ۳
-- با اسکریپت جداگانه و هش Argon2id ساخته می‌شود.
-- ═══════════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS `linenory`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `linenory`;

SET NAMES utf8mb4;

-- ── کاربران ──
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(60) NOT NULL,
  `phone` VARCHAR(16) NOT NULL DEFAULT '',
  `email` VARCHAR(160) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  `status` ENUM('active','blocked') NOT NULL DEFAULT 'active',
  `created_at` BIGINT NOT NULL,
  `last_login` BIGINT NOT NULL DEFAULT 0,
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_phone` (`phone`),
  KEY `ix_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── نشست‌ها ──
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `token` CHAR(64) NOT NULL,
  `expires_at` BIGINT NOT NULL,
  `ip` VARCHAR(45) NOT NULL DEFAULT '',
  `user_agent` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` BIGINT NOT NULL,
  UNIQUE KEY `uq_sessions_token` (`token`),
  KEY `ix_sessions_user` (`user_id`),
  KEY `ix_sessions_exp` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── محصولات ──
CREATE TABLE IF NOT EXISTS `products` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `slug` VARCHAR(120) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `description` VARCHAR(500) NOT NULL DEFAULT '',
  `price` BIGINT NOT NULL DEFAULT 0,
  `category` VARCHAR(24) NOT NULL DEFAULT 'mono',
  `image` VARCHAR(255) NOT NULL DEFAULT '',
  `stock` INT NOT NULL DEFAULT 0,
  `created_at` BIGINT NOT NULL,
  UNIQUE KEY `uq_products_slug` (`slug`),
  KEY `ix_products_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── استعلام‌ها ──
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL DEFAULT '',
  `quantity` INT NOT NULL DEFAULT 1,
  `message` VARCHAR(500) NOT NULL DEFAULT '',
  `status` ENUM('new','review','invoice','done','rejected') NOT NULL DEFAULT 'new',
  `created_at` BIGINT NOT NULL,
  `updated_at` BIGINT NOT NULL,
  KEY `ix_quotes_user` (`user_id`),
  KEY `ix_quotes_status` (`status`),
  CONSTRAINT `fk_quotes_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── پیام‌ها ──
CREATE TABLE IF NOT EXISTS `messages` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `from_user` CHAR(36) NOT NULL DEFAULT '',
  `to_user` CHAR(36) NOT NULL DEFAULT '',
  `subject` VARCHAR(120) NOT NULL DEFAULT '',
  `body` VARCHAR(600) NOT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` BIGINT NOT NULL,
  KEY `ix_messages_to` (`to_user`),
  KEY `ix_messages_from` (`from_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── علاقه‌مندی‌ها ──
CREATE TABLE IF NOT EXISTS `favorites` (
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `created_at` BIGINT NOT NULL,
  PRIMARY KEY (`user_id`, `product_id`),
  KEY `ix_fav_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── تنظیمات ──
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(64) NOT NULL PRIMARY KEY,
  `value` VARCHAR(500) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── لاگ حسابرسی ──
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL DEFAULT '',
  `action` VARCHAR(64) NOT NULL,
  `target` VARCHAR(128) NOT NULL DEFAULT '',
  `created_at` BIGINT NOT NULL,
  KEY `ix_audit_user` (`user_id`),
  KEY `ix_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── سید محصولات (۱۲ قلم، بدون گذرواژه) ──
INSERT INTO `products` (`id`, `slug`, `name`, `description`, `price`, `category`, `image`, `stock`, `created_at`) VALUES
('00000000-0000-4000-8000-000000000001', 'line-220v-mono-64led', 'لاین نوری ۲۲۰ولت تک‌رنگ ۶۴LED', 'لاین استاندارد ۲۲۰ولت، مناسب سقف کاذب و روسری', 185000, 'mono', '', 140, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000002', 'line-12v-2835', 'لاین نوری ۱۲ولت ۲۸۳۵ مخفی', 'نور یکنواخت کابینت و قفسه', 128000, 'mono', '', 220, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000003', 'line-cabinet-sensor', 'لاین نوری کابینت با حسگر حرکت', 'روشن‌شدن خودکار با درب کابینت', 480000, 'mono', '', 65, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000004', 'line-rgb-remote', 'لاین نوری RGB کنترل‌دار', '۱۶ میلیون رنگ با ریموت لمسی', 345000, 'rgb', '', 98, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000005', 'line-ws2811', 'لاین نوری آدرس‌پذیر WS2811', 'کنترل مستقل هر سگمنت', 890000, 'rgb', '', 40, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000006', 'line-rgbw', 'لاین نوری RGBW چهارموتوره', 'کانال سفید مستقل + RGB', 590000, 'rgbw', '', 52, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000007', 'line-cob-384led', 'لاین نوری COB یکدست ۳۸۴LED', 'خط پیوسته بدون نقطه', 720000, 'cob', '', 74, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000008', 'neon-flex-12v-ip67', 'نئون فلکس ۱۲ولت IP67', 'ضد باران، مناسب نما', 640000, 'cob', '', 88, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000009', 'profile-hidden-2m', 'پروفیل آلومینیومی مخفی ۲متری', 'دفع حرارت + روکش اپال', 195000, 'profile', '', 300, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000010', 'profile-corner', 'پروفیل گوشه‌ای کابینت', 'زاویه ۴۵ درجه بدون خیرگی', 165000, 'profile', '', 260, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000011', 'driver-12v-15a', 'درایور سوئیچینگ ۱۲ولت ۱۵آمپر', 'خروجی پایدار تا ۱۵ متر', 385000, 'driver', '', 120, UNIX_TIMESTAMP()),
('00000000-0000-4000-8000-000000000012', 'remote-rgb-touch', 'ریموت کنترل RGB لمسی + بلوتوث', 'چرخ رنگ لمسی + اپ موبایل', 260000, 'driver', '', 150, UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- ── سید تنظیمات (TODO: مقادیر واقعی در پنل ادمین) ──
INSERT INTO `settings` (`key`, `value`) VALUES
('phone', 'TODO_PHONE_DISPLAY__example__09123456789'),
('whatsapp', 'TODO_WHATSAPP__example__989123456789'),
('email', 'TODO_EMAIL__example__info@example.ir'),
('address', 'TODO_ADDRESS__example__تهران')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);
