-- Add Paymongo_Reference_Number column to reservations table
ALTER TABLE `reservations` 
ADD COLUMN `Paymongo_Reference_Number` varchar(255) NULL AFTER `Reference_Number`;

-- Add index for better performance
CREATE INDEX `idx_paymongo_ref` ON `reservations` (`Paymongo_Reference_Number`);
