@echo off
REM Database Export Script for Windows
REM This script exports the budz_reserve database to database_export.sql

echo Exporting database...
echo.

REM Check if mysqldump is available
where mysqldump >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: mysqldump not found in PATH
    echo Please install MySQL client tools or add MySQL bin directory to PATH
    echo.
    echo You can also export manually using:
    echo mysqldump -u root -p budz_reserve ^> database_export.sql
    pause
    exit /b 1
)

REM Read database credentials from .env file if it exists
set DB_HOST=localhost
set DB_PORT=3306
set DB_USERNAME=root
set DB_PASSWORD=
set DB_DATABASE=budz_reserve

if exist "backend\.env" (
    echo Reading database configuration from backend\.env...
    for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_HOST" backend\.env') do set DB_HOST=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_PORT" backend\.env') do set DB_PORT=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_USERNAME" backend\.env') do set DB_USERNAME=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_PASSWORD" backend\.env') do set DB_PASSWORD=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_DATABASE" backend\.env') do set DB_DATABASE=%%a
)

echo Database Configuration:
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo Username: %DB_USERNAME%
echo Database: %DB_DATABASE%
echo.

REM Export database
if "%DB_PASSWORD%"=="" (
    echo Exporting database (no password)...
    mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% %DB_DATABASE% > database_export.sql
) else (
    echo Exporting database (with password)...
    mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% -p%DB_PASSWORD% %DB_DATABASE% > database_export.sql
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database exported successfully to database_export.sql
) else (
    echo.
    echo ERROR: Database export failed
    echo Please check your database credentials and connection
)

pause