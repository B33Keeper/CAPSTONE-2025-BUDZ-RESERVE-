-- Create gallery table
CREATE TABLE IF NOT EXISTS `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_path` varchar(500) NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `sort_order` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert some sample gallery data
INSERT INTO `gallery` (`title`, `description`, `image_path`, `status`, `sort_order`) VALUES
('Group Photo 1', 'Client group photo from tournament', '/assets/img/home-page/GALLERY/IMAGE 1.jpg', 'active', 1),
('Group Photo 2', 'Client group photo from event', '/assets/img/home-page/GALLERY/IMAGE 2.jpg', 'active', 2),
('Group Photo 3', 'Client group photo from competition', '/assets/img/home-page/GALLERY/IMAGE 3.jpg', 'active', 3),
('Group Photo 4', 'Client group photo from match', '/assets/img/home-page/GALLERY/IMAGE 4.jpg', 'active', 4),
('Group Photo 5', 'Client group photo from championship', '/assets/img/home-page/GALLERY/IMAGE 5.jpg', 'active', 5),
('Group Photo 6', 'Client group photo from finals', '/assets/img/home-page/GALLERY/IMAGE 6.jpg', 'active', 6);

