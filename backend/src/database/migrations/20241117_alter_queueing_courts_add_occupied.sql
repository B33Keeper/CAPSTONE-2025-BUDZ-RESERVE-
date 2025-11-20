ALTER TABLE `queueing_courts`
  MODIFY `status` ENUM('available', 'occupied', 'maintenance', 'unavailable') NOT NULL DEFAULT 'available';

