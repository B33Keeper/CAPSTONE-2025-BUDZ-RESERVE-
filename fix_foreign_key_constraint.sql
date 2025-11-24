-- Quick fix for foreign key constraint issue
-- Run this SQL in phpMyAdmin to fix the constraint

-- Step 1: Find and drop the existing constraint
-- First, find the constraint name by running this query:
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'queue_matches'
  AND COLUMN_NAME = 'court_id'
  AND REFERENCED_TABLE_NAME = 'queueing_courts';

-- Step 2: Drop the constraint (replace 'FK_d5a0337f1dac2b96c88cb22799e' with the actual name from Step 1)
ALTER TABLE `queue_matches` 
  DROP FOREIGN KEY `FK_d5a0337f1dac2b96c88cb22799e`;

-- Step 3: Add the new constraint with ON DELETE SET NULL
ALTER TABLE `queue_matches`
  ADD CONSTRAINT `FK_queue_matches_court` 
  FOREIGN KEY (`court_id`) 
  REFERENCES `queueing_courts` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

