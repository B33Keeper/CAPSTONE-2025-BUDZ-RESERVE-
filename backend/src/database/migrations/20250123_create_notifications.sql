CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` ENUM('equipment_rental_expired') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `equipment_rental_item_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_notifications_is_read` (`is_read`),
  KEY `IDX_notifications_user_id` (`user_id`),
  KEY `IDX_notifications_equipment_rental_item_id` (`equipment_rental_item_id`),
  KEY `IDX_notifications_created_at` (`created_at`),
  CONSTRAINT `FK_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

