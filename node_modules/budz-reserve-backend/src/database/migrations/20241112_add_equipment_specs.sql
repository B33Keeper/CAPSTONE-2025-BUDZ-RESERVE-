ALTER TABLE `equipments`
  ADD COLUMN `unit` VARCHAR(100) NULL AFTER `image_path`,
  ADD COLUMN `weight` VARCHAR(100) NULL AFTER `unit`,
  ADD COLUMN `tension` VARCHAR(100) NULL AFTER `weight`;

h