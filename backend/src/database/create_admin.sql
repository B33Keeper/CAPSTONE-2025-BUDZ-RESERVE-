-- Note: The columns (role, is_active, is_verified) should already exist in the database
-- This script creates a default admin account

-- Create a default admin account
-- Username: admin
-- Password: Admin123! (must be hashed with bcrypt)
-- Email: admin@budzreserve.com

-- Note: This is a placeholder. To create an admin account with proper password hashing:
-- 1. Hash the password: docker exec -i budz-reserve-backend node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123!', 12).then(hash => console.log(hash));"
-- 2. Run the update query with the hashed password

INSERT INTO users (`name`, `age`, `sex`, `username`, `email`, `contact_number`, `password`, `role`, `is_active`, `is_verified`, `created_at`, `updated_at`) 
VALUES ('Admin User', 25, 'Male', 'admin', 'admin@budzreserve.com', '09181111111', '$2a$12$xwnFbg25nGtPRwGEUIZL4uZGovW6cBonsBf/7zXB16vY/g0pCso5e', 'admin', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `role` = 'admin';

-- Or update an existing user to be admin
-- UPDATE users SET role = 'admin' WHERE username = 'your_username';

