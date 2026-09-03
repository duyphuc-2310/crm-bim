USE crm_bim;

-- Settings table for app configuration
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default settings
INSERT INTO settings (`key`, `value`) VALUES
  ('monthly_target', '500000000'),
  ('silent_deal_days', '7'),
  ('theme', 'dark')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
