-- Central ITL Security Camera System Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `role` VARCHAR(50) DEFAULT 'RESIDENT',
  `avatar` VARCHAR(500),
  `phone` VARCHAR(50),
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `custom_permissions` JSON,
  `last_active` VARCHAR(100) DEFAULT 'Agora',
  `created_at` VARCHAR(100) DEFAULT '2026-01-01'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cameras` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `protocol` VARCHAR(50) DEFAULT 'RTSP',
  `rtsp_url` TEXT,
  `rtmp_url` TEXT,
  `stream_key` VARCHAR(100),
  `rtmp_server_url` TEXT,
  `full_rtmp_url` TEXT,
  `state_uf` VARCHAR(10),
  `city` VARCHAR(100),
  `status` VARCHAR(50) DEFAULT 'ONLINE',
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
  `thumbnail_url` TEXT,
  `created_at` VARCHAR(100) DEFAULT '2026-01-01'
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
-- Garante que colunas novas existam caso as tabelas já tenham sido criadas em versão anterior
SET @dbname = DATABASE();

SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'cameras' AND table_schema = @dbname AND column_name = 'thumbnail_url') = 0, 'ALTER TABLE cameras ADD COLUMN thumbnail_url TEXT NULL;', 'SELECT 1;');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'cameras' AND table_schema = @dbname AND column_name = 'rtmp_server_url') = 0, 'ALTER TABLE cameras ADD COLUMN rtmp_server_url TEXT NULL;', 'SELECT 1;');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'cameras' AND table_schema = @dbname AND column_name = 'full_rtmp_url') = 0, 'ALTER TABLE cameras ADD COLUMN full_rtmp_url TEXT NULL;', 'SELECT 1;');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'cameras' AND table_schema = @dbname AND column_name = 'state_uf') = 0, 'ALTER TABLE cameras ADD COLUMN state_uf VARCHAR(10) NULL;', 'SELECT 1;');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @query = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'cameras' AND table_schema = @dbname AND column_name = 'city') = 0, 'ALTER TABLE cameras ADD COLUMN city VARCHAR(100) NULL;', 'SELECT 1;');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO `backup_settings` (`id`, `schedule`, `destination`, `retention_days`, `last_backup_date`, `next_backup_date`) 
VALUES (1, 'WEEKLY_SUNDAY_0200', 'LOCAL_VPS', 30, '2026-07-20 02:00:00', '2026-07-27 02:00:00');

INSERT IGNORE INTO `notification_settings` (`id`, `push_enabled`, `sound_alerts`)
VALUES (1, TRUE, TRUE);

INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `last_active`, `created_at`)
VALUES ('user-superadmin-01', 'Super Admin Unity', 'suporte@unityautomacoes.com.br', '$2b$10$itlpasswordhash2026', 'ADMIN', 'ACTIVE', 'Agora mesmo', '2026-01-01');

INSERT IGNORE INTO `cameras` (`id`, `name`, `location`, `protocol`, `rtsp_url`, `rtmp_url`, `stream_key`, `rtmp_server_url`, `full_rtmp_url`, `state_uf`, `city`, `status`, `is_e2ee_encrypted`, `encryption_key_hash`, `fps`, `resolution`, `storage_used_gb`, `cloud_recordings_active`, `motion_sensitivity`, `ai_detection_enabled`, `two_way_audio_enabled`, `lat`, `lng`, `thumbnail_url`, `created_at`)
VALUES 
('cam-wpg8tz', 'Prado 11 - Portaria Principal', 'Prado - BA', 'RTMP', 'rtsp://admin:itl2026@192.168.1.100:554/live/ch0', 'rtmp://localhost:1935/live/cam_wpg8tz', 'cam_wpg8tz', 'rtmp://localhost:1935/live', '/live/cam_wpg8tz.m3u8', 'BA', 'Prado', 'ONLINE', 1, 'e2ee-hash-01', 30, '1080p Full HD', 0.50, 1, 8, 1, 1, -17.0397, -39.5312, 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800', '2026-01-01'),
('cam-jvv51l', 'Câmera Pátio Central', 'Itamaraju - BA', 'RTMP', 'rtsp://admin:itl2026@192.168.1.101:554/live/ch0', 'rtmp://localhost:1935/live/cam_jvv51l', 'cam_jvv51l', 'rtmp://localhost:1935/live', '/live/cam_jvv51l.m3u8', 'BA', 'Itamaraju', 'ONLINE', 1, 'e2ee-hash-02', 30, '1080p Full HD', 0.80, 1, 7, 1, 1, -17.0420, -39.5350, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', '2026-01-01'),
('cam-v7w3f8', 'Câmera Estacionamento Visitantes', 'Itamaraju - BA', 'RTMP', 'rtsp://admin:itl2026@192.168.1.102:554/live/ch0', 'rtmp://localhost:1935/live/cam_v7w3f8', 'cam_v7w3f8', 'rtmp://localhost:1935/live', '/live/cam_v7w3f8.m3u8', 'BA', 'Itamaraju', 'ONLINE', 1, 'e2ee-hash-03', 30, '1080p Full HD', 0.30, 1, 6, 1, 1, -17.0380, -39.5290, 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?w=800', '2026-01-01');
