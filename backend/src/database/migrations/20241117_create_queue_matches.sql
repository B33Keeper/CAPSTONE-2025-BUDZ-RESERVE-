CREATE TABLE IF NOT EXISTS `queue_matches` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `game_type` ENUM('mens-doubles', 'womens-doubles', 'mixed-doubles') NOT NULL,
  `status` ENUM('pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `team_a` JSON NOT NULL,
  `team_b` JSON NOT NULL,
  `court_id` INT DEFAULT NULL,
  `court_name` VARCHAR(100) DEFAULT NULL,
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_queue_matches_status` (`status`),
  KEY `IDX_queue_matches_court` (`court_id`),
  CONSTRAINT `FK_queue_matches_court` FOREIGN KEY (`court_id`) REFERENCES `queueing_courts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

