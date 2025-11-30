-- Create fee_management_history table for historical fee records
CREATE TABLE IF NOT EXISTS `fee_management_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `player_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `player_name` varchar(120) NOT NULL,
  `player_sex` enum('male','female') NOT NULL,
  `games_played` int NOT NULL DEFAULT 0,
  `shuttle_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `court_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('paid','unpaid') NOT NULL DEFAULT 'unpaid',
  `fee_date` date NOT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fee_management_history_player_id` (`player_id`),
  KEY `idx_fee_management_history_user_id` (`user_id`),
  KEY `idx_fee_management_history_fee_date` (`fee_date`),
  KEY `idx_fee_management_history_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

