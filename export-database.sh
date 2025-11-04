#!/bin/bash
# Database Export Script for Linux/Mac
# This script exports the budz_reserve database to database_export.sql

echo "Exporting database..."
echo ""

# Check if mysqldump is available
if ! command -v mysqldump &> /dev/null; then
    echo "ERROR: mysqldump not found in PATH"
    echo "Please install MySQL client tools"
    exit 1
fi

# Read database credentials from .env file if it exists
DB_HOST="localhost"
DB_PORT="3306"
DB_USERNAME="root"
DB_PASSWORD=""
DB_DATABASE="budz_reserve"

if [ -f "backend/.env" ]; then
    echo "Reading database configuration from backend/.env..."
    export $(grep -v '^#' backend/.env | grep -E '^DB_' | xargs)
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USERNAME=${DB_USERNAME:-root}
    DB_PASSWORD=${DB_PASSWORD:-}
    DB_DATABASE=${DB_DATABASE:-budz_reserve}
fi

echo "Database Configuration:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Username: $DB_USERNAME"
echo "Database: $DB_DATABASE"
echo ""

# Export database
if [ -z "$DB_PASSWORD" ]; then
    echo "Exporting database (no password)..."
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_DATABASE" > database_export.sql
else
    echo "Exporting database (with password)..."
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" > database_export.sql
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "Database exported successfully to database_export.sql"
else
    echo ""
    echo "ERROR: Database export failed"
    echo "Please check your database credentials and connection"
    exit 1
fi

