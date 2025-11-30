-- Fix foreign key constraint to allow court deletion by setting court_id to NULL
-- This migration updates the existing constraint to use ON DELETE SET NULL
--
-- INSTRUCTIONS:
-- 1. First, find the constraint name by running:
--    SELECT CONSTRAINT_NAME 
--    FROM information_schema.KEY_COLUMN_USAGE 
--    WHERE TABLE_SCHEMA = 'budz_reserve'
--      AND TABLE_NAME = 'queue_matches'
--      AND COLUMN_NAME = 'court_id'
--      AND REFERENCED_TABLE_NAME = 'queueing_courts';
--
-- 2. Then drop the constraint (replace CONSTRAINT_NAME with the actual name):
--    ALTER TABLE `queue_matches` DROP FOREIGN KEY `CONSTRAINT_NAME`;
--
-- 3. Finally, add the new constraint with ON DELETE SET NULL:
--    ALTER TABLE `queue_matches`
--      ADD CONSTRAINT `FK_queue_matches_court` 
--      FOREIGN KEY (`court_id`) 
--      REFERENCES `queueing_courts` (`id`) 
--      ON DELETE SET NULL 
--      ON UPDATE CASCADE;

-- Automated version (run this if the constraint name is known):
-- Replace 'FK_d5a0337f1dac2b96c88cb22799e' with your actual constraint name from step 1

-- Step 1: Drop existing constraint (update constraint name as needed)
ALTER TABLE `queue_matches` 
  DROP FOREIGN KEY `FK_d5a0337f1dac2b96c88cb22799e`;

-- Step 2: Add new constraint with ON DELETE SET NULL
ALTER TABLE `queue_matches`
  ADD CONSTRAINT `FK_queue_matches_court` 
  FOREIGN KEY (`court_id`) 
  REFERENCES `queueing_courts` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

