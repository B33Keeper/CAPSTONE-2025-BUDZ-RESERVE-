ALTER TABLE `queue_players`
  MODIFY `status` ENUM('In Queue', 'Waiting', 'In Match') NOT NULL DEFAULT 'In Queue';

