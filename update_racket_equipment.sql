-- Update equipment table with new badminton racket entries
-- This will replace existing equipment with new racket varieties

-- First, clear existing equipment data
DELETE FROM `equipments`;

-- Reset auto increment
ALTER TABLE `equipments` AUTO_INCREMENT = 1;

-- Add the image_path column if it doesn't exist
ALTER TABLE `equipments` ADD COLUMN IF NOT EXISTS `image_path` varchar(255) DEFAULT '/assets/img/equipments/racket.png';

-- Insert new badminton racket equipment entries
INSERT INTO `equipments` (`equipment_name`, `stocks`, `price`, `description`, `status`, `image_path`) VALUES
('Professional Badminton Racket - Black/Red', 15, 180.00, 'High-quality professional racket with black and red design, perfect for competitive play', 'Available', '/assets/img/equipments/racket-black-red.png'),
('Premium Badminton Racket - Silver/White', 12, 200.00, 'Premium silver and white racket with advanced technology for professional players', 'Available', '/assets/img/equipments/racket-silver-white.png'),
('Elite Badminton Racket - Dark Frame', 18, 160.00, 'Elite series racket with dark frame and white grip, excellent for intermediate players', 'Available', '/assets/img/equipments/racket-dark-frame.png'),
('Championship Badminton Racket - White/Silver', 10, 220.00, 'Championship grade racket with white head and silver frame, tournament ready', 'Available', '/assets/img/equipments/racket-white-silver.png'),
('Tournament Badminton Racket - Yellow/Green', 14, 190.00, 'Tournament quality racket with vibrant yellow and green design, high performance', 'Available', '/assets/img/equipments/racket-yellow-green.png'),
('Standard Badminton Racket', 20, 150.00, 'Standard quality badminton racket suitable for recreational play', 'Available', '/assets/img/equipments/racket.png');
