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

-- Note: MySQL does not support IF NOT EXISTS on ADD COLUMN easily. 
-- If you get a duplicate column error, it means this was already applied.
ALTER TABLE `device` ADD COLUMN `last_ping_at` TIMESTAMP NULL DEFAULT NULL;
