ALTER TABLE `queue_matches`
  ADD COLUMN `winner` ENUM('teamA', 'teamB', 'draw') NULL AFTER `completed_at`;

