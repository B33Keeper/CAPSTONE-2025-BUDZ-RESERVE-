CREATE TABLE IF NOT EXISTS `queue_matches_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `original_id` INT NOT NULL,
  `game_type` ENUM('mens-doubles', 'womens-doubles', 'mixed-doubles') NOT NULL,
  `team_a` JSON NOT NULL,
  `team_b` JSON NOT NULL,
  `court_id` INT DEFAULT NULL,
  `court_name` VARCHAR(100) DEFAULT NULL,
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `winner` ENUM('teamA', 'teamB', 'draw') DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `archived_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_queue_matches_history_user_id` (`user_id`),
  KEY `IDX_queue_matches_history_archived_at` (`archived_at`),
  KEY `IDX_queue_matches_history_original_id` (`original_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

