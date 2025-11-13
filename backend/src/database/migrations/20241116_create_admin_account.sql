-- Create admin account
-- Password: Admin@123
-- Run this SQL in phpMyAdmin or your database tool

-- First, check if admin already exists and delete it if needed (optional)
-- DELETE FROM `users` WHERE `username` = 'admin' OR `email` = 'admin@budzreserve.com';

-- Insert admin account
INSERT INTO `users` (`name`, `age`, `sex`, `username`, `email`, `contact_number`, `password`, `role`, `is_active`, `is_verified`, `created_at`)
VALUES (
  'Admin User',
  30,
  'Male',
  'admin',
  'admin@budzreserve.com',
  '09123456789',
  '$2a$10$O1aYsSDGIv76bchWbAtyZuTHmVj8pyjzDqww/arY3BdkmFC8.NqWW',
  'admin',
  1,
  1,
  NOW()
);

