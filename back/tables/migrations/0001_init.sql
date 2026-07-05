CREATE TABLE IF NOT EXISTS `users` (
  `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `update_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `device` (
    `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_uuid` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `model` VARCHAR(255) DEFAULT NULL,
    `type` VARCHAR(255) NOT NULL DEFAULT 'unknown',
    `status` VARCHAR(255) NOT NULL DEFAULT 'active',
    `last_ping_at` TIMESTAMP NULL DEFAULT NULL,
    `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `sit_data` (
    `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
    `device_uuid` VARCHAR(255) NOT NULL,
    `start_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `end_at` TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (device_uuid) REFERENCES device(uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `activity_data` (
    `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
    `device_uuid` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_uuid) REFERENCES device(uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_uuid VARCHAR(255) NOT NULL,
    token VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_token (token),
    INDEX idx_user_uuid (user_uuid),
    CONSTRAINT fk_user_uuid FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `owner_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_uuid` VARCHAR(255) NOT NULL,
    `device_uuid` VARCHAR(255) DEFAULT NULL,
    `name` VARCHAR(255) NOT NULL DEFAULT 'Unknown Device',
    `token` VARCHAR(512) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_owner_token` (`token`),
    UNIQUE KEY `unique_owner_device` (`device_uuid`),
    INDEX `idx_owner_token_user` (`user_uuid`),
    CONSTRAINT `fk_owner_token_user`
        FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `schedule` (
    `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_uuid` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `day_of_week` TINYINT UNSIGNED NOT NULL COMMENT '0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土',
    `start_time` TIME NOT NULL COMMENT '開始時刻 (HH:MM:SS)',
    `end_time` TIME NOT NULL COMMENT '終了時刻 (HH:MM:SS)',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '有効フラグ',
    `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_uuid`) REFERENCES `users`(`uuid`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `device_commands` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `device_uuid` VARCHAR(255) NOT NULL,
    `command_type` VARCHAR(255) NOT NULL,
    `payload` JSON DEFAULT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, completed, failed',
    `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`device_uuid`) REFERENCES `device`(`uuid`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `device_status_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `device_uuid` VARCHAR(255) NOT NULL,
    `battery_level` INT DEFAULT NULL,
    `is_sitting` TINYINT(1) DEFAULT 0,
    `other_status` JSON DEFAULT NULL,
    `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`device_uuid`) REFERENCES `device`(`uuid`) ON DELETE CASCADE
);
