CREATE TABLE IF NOT EXISTS `queue_players` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `sex` enum('male','female') NOT NULL,
  `skill` enum('Beginner','Intermediate','Advanced') NOT NULL,
  `games_played` int NOT NULL DEFAULT 0,
  `status` enum('In Queue','Waiting') NOT NULL DEFAULT 'In Queue',
  `last_played` date DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

