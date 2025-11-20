INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Aria Lopez', 'female', 'Intermediate', 1, 'In Queue', '2025-11-12', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Aria Lopez' AND `last_played` = '2025-11-12'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Ben Lim', 'male', 'Advanced', 2, 'In Queue', '2025-11-12', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Ben Lim' AND `last_played` = '2025-11-12'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Carla Reyes', 'female', 'Beginner', 0, 'In Queue', '2025-11-12', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Carla Reyes' AND `last_played` = '2025-11-12'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Darren Cruz', 'male', 'Intermediate', 1, 'In Queue', '2025-11-12', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Darren Cruz' AND `last_played` = '2025-11-12'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Ella Santos', 'female', 'Advanced', 3, 'In Queue', '2025-11-12', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Ella Santos' AND `last_played` = '2025-11-12'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Floyd Rivera', 'male', 'Intermediate', 2, 'In Queue', '2025-11-11', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Floyd Rivera' AND `last_played` = '2025-11-11'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Gina Tan', 'female', 'Beginner', 1, 'In Queue', '2025-11-11', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Gina Tan' AND `last_played` = '2025-11-11'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Harvey Ong', 'male', 'Advanced', 4, 'In Queue', '2025-11-11', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Harvey Ong' AND `last_played` = '2025-11-11'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Ivy Dela Cruz', 'female', 'Intermediate', 2, 'In Queue', '2025-11-11', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Ivy Dela Cruz' AND `last_played` = '2025-11-11'
);

INSERT INTO `queue_players` (`name`, `sex`, `skill`, `games_played`, `status`, `last_played`, `created_at`, `updated_at`)
SELECT 'Jules Bautista', 'male', 'Beginner', 0, 'In Queue', '2025-11-11', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `queue_players` WHERE `name` = 'Jules Bautista' AND `last_played` = '2025-11-11'
);

