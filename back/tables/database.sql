CREATE TABLE IF NOT EXISTS `users` (
  `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NULL,
  `email` varchar(255) NULL,
  `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `update_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `device` (
    `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_uuid` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `status` VARCHAR(255) NOT NULL,
    `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS `sit_data` (
    `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
    `device_uuid` VARCHAR(255) NOT NULL,
    `start_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `end_at` TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (device_uuid) REFERENCES device(uuid)
);

CREATE TABLE IF NOT EXISTS `activity_data` (
    `uuid` VARCHAR(255) NOT NULL PRIMARY KEY,
    `device_uuid` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `create_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_uuid) REFERENCES device(uuid)
);

INSERT INTO `users` (`uuid`, `username`, `email`, `password`) 
VALUES (
    'user-uuid-1111-2222-3333', 
    'test_user', 
    'test@example.com', 
    'hashed_password_123'
);

INSERT INTO `device` (`uuid`, `user_uuid`, `name`, `type`, `status`) VALUES
    ('device-uuid-0001-aaaa-bbbb', 'user-uuid-1111-2222-3333', 'Wearable A', 'sensor', 'active'),
    ('device-uuid-0002-cccc-dddd', 'user-uuid-1111-2222-3333', 'Wearable B', 'sensor', 'inactive');

INSERT INTO `sit_data` (`uuid`, `device_uuid`, `start_at`, `end_at`) VALUES
    ('sit-uuid-0001-1111-2222', 'device-uuid-0001-aaaa-bbbb', '2026-06-05 08:00:00', '2026-06-05 09:30:00'),
    ('sit-uuid-0002-3333-4444', 'device-uuid-0002-cccc-dddd', '2026-06-05 10:00:00', NULL);

INSERT INTO `activity_data` (`uuid`, `device_uuid`, `type`, `create_at`) VALUES
    ('activity-uuid-0001-1111-2222', 'device-uuid-0001-aaaa-bbbb', 'walking', '2026-06-05 08:15:00'),
    ('activity-uuid-0002-3333-4444', 'device-uuid-0002-cccc-dddd', 'sitting', '2026-06-05 10:05:00');