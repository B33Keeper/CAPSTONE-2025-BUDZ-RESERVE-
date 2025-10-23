-- Budz Reserve Database Initialization
-- This script sets up the database for the React version

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS budz_reserve;
USE budz_reserve;

-- Set proper character set and collation
ALTER DATABASE budz_reserve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Import the exported database
-- Note: The actual data will be imported from database_export.sql
