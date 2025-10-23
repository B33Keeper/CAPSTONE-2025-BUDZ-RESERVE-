-- Update all equipment to be different types of badminton rackets
-- This will replace all existing equipment with various racket types

-- First, clear existing equipment data
DELETE FROM `equipments`;

-- Reset auto increment
ALTER TABLE `equipments` AUTO_INCREMENT = 1;

-- Insert different types of badminton rackets
INSERT INTO `equipments` (`equipment_name`, `stocks`, `price`, `description`, `status`) VALUES
('Professional Badminton Racket - Black/Red', 15, 180.00, 'High-quality professional racket with black and red design, perfect for competitive play', 'Available'),
('Premium Badminton Racket - Silver/White', 12, 200.00, 'Premium silver and white racket with advanced technology for professional players', 'Available'),
('Elite Badminton Racket - Dark Frame', 18, 160.00, 'Elite series racket with dark frame and white grip, excellent for intermediate players', 'Available'),
('Championship Badminton Racket - White/Silver', 10, 220.00, 'Championship grade racket with white head and silver frame, tournament ready', 'Available'),
('Tournament Badminton Racket - Yellow/Green', 14, 190.00, 'Tournament quality racket with vibrant yellow and green design, high performance', 'Available'),
('Standard Badminton Racket', 20, 150.00, 'Standard quality badminton racket suitable for recreational play', 'Available');
