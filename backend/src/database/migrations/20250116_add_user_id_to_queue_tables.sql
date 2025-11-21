-- Add user_id column to queue_players table
ALTER TABLE queue_players
ADD COLUMN user_id INT NOT NULL DEFAULT 1;

-- Add user_id column to queue_matches table
ALTER TABLE queue_matches
ADD COLUMN user_id INT NOT NULL DEFAULT 1;

-- Add foreign key constraints (optional, but recommended)
-- Note: Adjust based on your users table structure
-- ALTER TABLE queue_players
-- ADD CONSTRAINT fk_queue_players_user_id
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE queue_matches
-- ADD CONSTRAINT fk_queue_matches_user_id
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX idx_queue_players_user_id ON queue_players(user_id);
CREATE INDEX idx_queue_matches_user_id ON queue_matches(user_id);

