-- Central ITL Security Camera System Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabela: license_plates (LPR)
CREATE TABLE IF NOT EXISTS `license_plates` (
  `id` VARCHAR(64) NOT NULL,
  `camera_id` VARCHAR(64) NULL,
  `camera_name` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state_uf` VARCHAR(20) NULL,
  `plate_number` VARCHAR(50) NOT NULL,
  `vehicle_type` VARCHAR(50) DEFAULT 'Carro',
  `vehicle_color` VARCHAR(50) NULL,
  `confidence` INT DEFAULT 95,
  `snapshot_url` TEXT NULL,
  `timestamp` VARCHAR(100) NULL,
  `lat` DOUBLE NULL,
  `lng` DOUBLE NULL,
  `is_stolen_or_wanted` TINYINT(1) DEFAULT 0,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela: cameras
CREATE TABLE IF NOT EXISTS `cameras` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `location` TEXT NULL,
  `protocol` VARCHAR(50) DEFAULT 'RTSP',
  `rtsp_url` TEXT NULL,
  `rtmp_url` TEXT NULL,
  `stream_key` VARCHAR(100) NULL,
  `rtmp_server_url` TEXT NULL,
  `full_rtmp_url` TEXT NULL,
  `state_uf` VARCHAR(20) NULL,
  `city` VARCHAR(100) NULL,
  `status` VARCHAR(50) DEFAULT 'ONLINE',
  `is_e2ee_encrypted` TINYINT(1) DEFAULT 1,
  `encryption_key_hash` TEXT NULL,
  `fps` INT DEFAULT 30,
  `resolution` VARCHAR(50) DEFAULT '1080p',
  `storage_used_gb` DOUBLE DEFAULT 0.1,
  `cloud_recordings_active` TINYINT(1) DEFAULT 1,
  `motion_sensitivity` INT DEFAULT 7,
  `ai_detection_enabled` TINYINT(1) DEFAULT 1,
  `two_way_audio_enabled` TINYINT(1) DEFAULT 1,
  `lat` DOUBLE NULL,
  `lng` DOUBLE NULL,
  `thumbnail_url` TEXT NULL,
  `created_at` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `role` VARCHAR(50) DEFAULT 'RESIDENT',
  `phone` VARCHAR(50) NULL,
  `state_uf` VARCHAR(20) NULL,
  `city` VARCHAR(100) NULL,
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `custom_permissions` JSON NULL,
  `allowed_camera_ids` JSON NULL,
  `plan_id` VARCHAR(64) NULL,
  `plan_name` VARCHAR(255) NULL,
  `monthly_fee` DOUBLE DEFAULT 0,
  `chosen_due_day` INT DEFAULT 5,
  `financial_status` VARCHAR(50) DEFAULT 'OK',
  `days_overdue` INT DEFAULT 0,
  `last_active` VARCHAR(100) DEFAULT 'Agora',
  `created_at` VARCHAR(100) DEFAULT '2026-01-01',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela: cloud_recordings
CREATE TABLE IF NOT EXISTS `cloud_recordings` (
  `id` VARCHAR(64) NOT NULL,
  `camera_id` VARCHAR(64) NULL,
  `camera_name` VARCHAR(255) NULL,
  `start_time` VARCHAR(100) NULL,
  `end_time` VARCHAR(100) NULL,
  `duration_sec` INT DEFAULT 0,
  `file_size_mb` DOUBLE DEFAULT 0,
  `stream_url` TEXT NULL,
  `thumbnail_url` TEXT NULL,
  `created_at` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabela: motion_alerts
CREATE TABLE IF NOT EXISTS `motion_alerts` (
  `id` VARCHAR(64) NOT NULL,
  `camera_id` VARCHAR(64) NULL,
  `camera_name` VARCHAR(255) NULL,
  `event_type` VARCHAR(50) DEFAULT 'HUMAN',
  `confidence` INT DEFAULT 90,
  `snapshot_url` TEXT NULL,
  `video_clip_url` TEXT NULL,
  `timestamp` VARCHAR(100) NULL,
  `severity` VARCHAR(50) DEFAULT 'HIGH',
  `read_status` TINYINT(1) DEFAULT 0,
  `pushed_to_mobile` TINYINT(1) DEFAULT 1,
  `created_at` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabela: activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `user_name` VARCHAR(255) NULL,
  `action` TEXT NULL,
  `category` VARCHAR(50) DEFAULT 'SYSTEM',
  `details` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `timestamp` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabela: financial_plans
CREATE TABLE IF NOT EXISTS `financial_plans` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `monthly_price` DOUBLE DEFAULT 0,
  `cameras_included` INT DEFAULT 4,
  `cloud_retention_days` INT DEFAULT 7,
  `description` TEXT NULL,
  `popular` TINYINT(1) DEFAULT 0,
  `created_at` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabela: financial_invoices
CREATE TABLE IF NOT EXISTS `financial_invoices` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `user_name` VARCHAR(255) NULL,
  `user_email` VARCHAR(255) NULL,
  `plan_name` VARCHAR(255) NULL,
  `amount` DOUBLE DEFAULT 0,
  `original_amount` DOUBLE DEFAULT 0,
  `due_date` VARCHAR(100) NULL,
  `payment_date` VARCHAR(100) NULL,
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `is_pro_rata` TINYINT(1) DEFAULT 0,
  `pro_rata_days` INT DEFAULT 0,
  `pix_code` TEXT NULL,
  `pix_qr_code_url` TEXT NULL,
  `mercado_pago_payment_id` VARCHAR(100) NULL,
  `created_at` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabela: mercado_pago_config
CREATE TABLE IF NOT EXISTS `mercado_pago_config` (
  `id` VARCHAR(64) NOT NULL DEFAULT 'default',
  `access_token` TEXT NULL,
  `public_key` TEXT NULL,
  `webhook_secret` TEXT NULL,
  `is_sandbox` TINYINT(1) DEFAULT 1,
  `auto_approve_simulated` TINYINT(1) DEFAULT 1,
  `updated_at` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabela: backup_settings
CREATE TABLE IF NOT EXISTS `backup_settings` (
  `id` VARCHAR(64) NOT NULL DEFAULT 'default',
  `schedule` VARCHAR(50) NULL,
  `destination` VARCHAR(50) NULL,
  `retention_days` INT DEFAULT 30,
  `encrypt_backups` TINYINT(1) DEFAULT 1,
  `auto_backup_enabled` TINYINT(1) DEFAULT 1,
  `last_backup_date` VARCHAR(100) NULL,
  `next_backup_date` VARCHAR(100) NULL,
  `status` VARCHAR(50) NULL,
  `storage_path` VARCHAR(255) NULL,
  `storage_limit_gb` INT DEFAULT 100,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabela: notification_settings
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` VARCHAR(64) NOT NULL DEFAULT 'default',
  `push_enabled` TINYINT(1) DEFAULT 1,
  `fcm_server_key` TEXT NULL,
  `telegram_bot_token` TEXT NULL,
  `telegram_chat_id` VARCHAR(100) NULL,
  `whatsapp_webhook_url` TEXT NULL,
  `sound_alerts` TINYINT(1) DEFAULT 1,
  `quiet_hours_enabled` TINYINT(1) DEFAULT 0,
  `quiet_hours_start` VARCHAR(20) NULL,
  `quiet_hours_end` VARCHAR(20) NULL,
  `alert_severities` JSON NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabela: system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` VARCHAR(64) NOT NULL DEFAULT 'default',
  `storage_limit_gb` DOUBLE DEFAULT 100,
  `vault_unlocked` TINYINT(1) DEFAULT 1,
  `passphrase_hash` TEXT NULL,
  `algorithm` VARCHAR(50) DEFAULT 'AES-256-GCM',
  `updated_at` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial essential default data
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `state_uf`, `city`, `status`, `custom_permissions`, `allowed_camera_ids`, `plan_id`, `plan_name`, `monthly_fee`, `chosen_due_day`, `financial_status`, `days_overdue`, `last_active`, `created_at`)
VALUES ('user-superadmin-01', 'Super Admin Unity', 'suporte@unityautomacoes.com.br', '$2b$10$itlpasswordhash2026', 'ADMIN', '+55 11 98765-4321', 'BA', 'Itamaraju', 'ACTIVE', '{"canViewLive":true,"canViewRecordings":true,"canControlPTZ":true,"canUseTwoWayAudio":true,"canManageCameras":true,"canDeleteRecordings":true,"canAccessAuditLogs":true,"canManageUsers":true,"canExportReports":true}', '["ALL"]', 'plan-vizinhanca-01', 'Plano Vizinhança Protegida ITL', 149.90, 5, 'OK', 0, 'Agora mesmo', '2026-01-01');

INSERT IGNORE INTO `financial_plans` (`id`, `name`, `monthly_price`, `cameras_included`, `cloud_retention_days`, `description`, `popular`, `created_at`)
VALUES 
('plan-vizinhanca-01', 'Plano Vizinhança Protegida ITL', 149.90, 4, 7, 'Ideal para ruas residenciais e condomínios até 4 câmeras HD com retenção de 7 dias.', 1, '2026-07-01'),
('plan-comercial-02', 'Plano Comercio Seguro Pro', 299.90, 8, 15, 'Para estabelecimentos comerciais com suporte a 8 câmeras e IA de Detecção Humana.', 0, '2026-07-01'),
('plan-enterprise-03', 'Plano Enterprise Cidade Segura', 599.90, 16, 30, 'Máxima segurança e retenção de 30 dias na nuvem com criptografia E2EE.', 0, '2026-07-01');

INSERT IGNORE INTO `mercado_pago_config` (`id`, `access_token`, `public_key`, `webhook_secret`, `is_sandbox`, `auto_approve_simulated`, `updated_at`)
VALUES ('default', '', '', '', 1, 1, '2026-07-28 00:00:00');

INSERT IGNORE INTO `backup_settings` (`id`, `schedule`, `destination`, `retention_days`, `encrypt_backups`, `auto_backup_enabled`, `last_backup_date`, `next_backup_date`, `status`, `storage_path`, `storage_limit_gb`) 
VALUES ('default', 'WEEKLY_SUNDAY_0200', 'LOCAL_VPS', 30, 1, 1, '2026-07-20 02:00:00', '2026-07-27 02:00:00', 'IDLE', '/var/www/itl-backups/', 100);

INSERT IGNORE INTO `notification_settings` (`id`, `push_enabled`, `sound_alerts`, `quiet_hours_enabled`, `quiet_hours_start`, `quiet_hours_end`, `alert_severities`)
VALUES ('default', 1, 1, 0, '23:00', '06:00', '["CRITICAL", "HIGH", "MEDIUM"]');

INSERT IGNORE INTO `system_settings` (`id`, `storage_limit_gb`, `vault_unlocked`, `passphrase_hash`, `algorithm`, `updated_at`)
VALUES ('default', 100, 1, 'e2ee-master-passphrase-itl-sec-2026', 'AES-256-GCM', '2026-07-28 00:00:00');

SET FOREIGN_KEY_CHECKS = 1;
