-- Central ITL Security Camera System Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'OPERATOR', 'GUARD', 'RESIDENT', 'VIEWER') DEFAULT 'RESIDENT',
  `avatar` VARCHAR(500),
  `phone` VARCHAR(50),
  `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  `custom_permissions` JSON,
  `last_active` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cameras` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `protocol` ENUM('RTSP', 'RTMP') DEFAULT 'RTSP',
  `rtsp_url` TEXT NOT NULL,
  `rtmp_url` TEXT,
  `stream_key` VARCHAR(100),
  `rtmp_server_url` TEXT,
  `full_rtmp_url` TEXT,
  `state_uf` VARCHAR(10),
  `city` VARCHAR(100),
  `status` ENUM('ONLINE', 'OFFLINE', 'RECORDING', 'ALERT') DEFAULT 'ONLINE',
  `is_e2ee_encrypted` BOOLEAN DEFAULT TRUE,
  `encryption_key_hash` VARCHAR(255),
  `fps` INT DEFAULT 30,
  `resolution` VARCHAR(50) DEFAULT '1080p',
  `storage_used_gb` DECIMAL(10,2) DEFAULT 0.00,
  `cloud_recordings_active` BOOLEAN DEFAULT TRUE,
  `motion_sensitivity` INT DEFAULT 7,
  `ai_detection_enabled` BOOLEAN DEFAULT TRUE,
  `two_way_audio_enabled` BOOLEAN DEFAULT TRUE,
  `lat` DECIMAL(10, 8),
  `lng` DECIMAL(11, 8),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `motion_alerts` (
  `id` VARCHAR(64) PRIMARY KEY,
  `camera_id` VARCHAR(64) NOT NULL,
  `camera_name` VARCHAR(255) NOT NULL,
  `event_type` ENUM('HUMAN', 'VEHICLE', 'ANIMAL', 'INTRUSION', 'SOUND', 'MOTION') DEFAULT 'HUMAN',
  `confidence` INT DEFAULT 95,
  `snapshot_url` TEXT,
  `video_clip_url` TEXT,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  `read_status` BOOLEAN DEFAULT FALSE,
  `pushed_to_mobile` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`camera_id`) REFERENCES `cameras`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cloud_recordings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `camera_id` VARCHAR(64) NOT NULL,
  `camera_name` VARCHAR(255) NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `duration_seconds` INT NOT NULL,
  `file_size_mb` DECIMAL(10,2) NOT NULL,
  `thumbnail_url` TEXT,
  `stream_url` TEXT NOT NULL,
  `is_e2ee_locked` BOOLEAN DEFAULT TRUE,
  `tags` VARCHAR(255) DEFAULT 'CONTINUOUS',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`camera_id`) REFERENCES `cameras`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64),
  `user_name` VARCHAR(255) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `category` ENUM('AUTH', 'LIVE_VIEW', 'RECORDING', 'SYSTEM', 'BACKUP', 'PTZ', 'AUDIO') DEFAULT 'SYSTEM',
  `details` TEXT,
  `ip_address` VARCHAR(45),
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `backup_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `schedule` VARCHAR(100) DEFAULT 'WEEKLY_SUNDAY_0200',
  `destination` ENUM('LOCAL_VPS', 'AWS_S3', 'WASABI', 'GOOGLE_DRIVE') DEFAULT 'LOCAL_VPS',
  `retention_days` INT DEFAULT 30,
  `encrypt_backups` BOOLEAN DEFAULT TRUE,
  `auto_backup_enabled` BOOLEAN DEFAULT TRUE,
  `last_backup_date` DATETIME,
  `next_backup_date` DATETIME,
  `status` ENUM('IDLE', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'IDLE',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `push_enabled` BOOLEAN DEFAULT TRUE,
  `fcm_server_key` TEXT,
  `telegram_bot_token` TEXT,
  `telegram_chat_id` VARCHAR(100),
  `whatsapp_webhook_url` TEXT,
  `sound_alerts` BOOLEAN DEFAULT TRUE,
  `quiet_hours_enabled` BOOLEAN DEFAULT FALSE,
  `quiet_hours_start` VARCHAR(10) DEFAULT '23:00',
  `quiet_hours_end` VARCHAR(10) DEFAULT '06:00',
  `alert_severities` VARCHAR(255) DEFAULT 'HIGH,CRITICAL,MEDIUM'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial default seed data
INSERT IGNORE INTO `backup_settings` (`id`, `schedule`, `destination`, `retention_days`, `last_backup_date`, `next_backup_date`) 
VALUES (1, 'WEEKLY_SUNDAY_0200', 'LOCAL_VPS', 30, '2026-07-20 02:00:00', '2026-07-27 02:00:00');

INSERT IGNORE INTO `notification_settings` (`id`, `push_enabled`, `sound_alerts`)
VALUES (1, TRUE, TRUE);

INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `status`)
VALUES ('user-superadmin-01', 'Super Admin Unity', 'suporte@unityautomacoes.com.br', '$2b$10$200616hashsimulated', 'ADMIN', 'ACTIVE');
