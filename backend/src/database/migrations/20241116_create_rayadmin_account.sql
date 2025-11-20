-- Create Raymond Admin account
-- Password: Admin123_
-- Run this SQL in phpMyAdmin or your preferred DB client

INSERT INTO `users` (
  `name`,
  `age`,
  `sex`,
  `username`,
  `email`,
  `contact_number`,
  `password`,
  `role`,
  `is_active`,
  `is_verified`,
  `created_at`,
  `updated_at`
)
VALUES (
  'Raymond Admin',
  NULL,
  NULL,
  'RayAdmin',
  'blickyy213285@gmail.com',
  NULL,
  '$2a$12$.AlVpmjtEfOp9EJ1AW8FQOg.4IplzS1wTOvaDQqpR3mEmiDkoz9Ze',
  'admin',
  1,
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `password` = VALUES(`password`),
  `role` = VALUES(`role`),
  `is_active` = VALUES(`is_active`),
  `is_verified` = VALUES(`is_verified`),
  `updated_at` = NOW();

