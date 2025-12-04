-- Add can_manage_queueing column to users table
ALTER TABLE `users` 
ADD COLUMN `can_manage_queueing` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role`;

