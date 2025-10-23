@echo off
echo Setting up Budz Reserve for GitHub upload...
echo.

REM Create .env file from template
if not exist .env (
    echo Creating .env file from template...
    copy env.template .env
    echo .env file created. Please review and update with your settings.
) else (
    echo .env file already exists.
)

REM Create uploads directory structure
if not exist uploads (
    echo Creating uploads directory...
    mkdir uploads
    mkdir uploads\avatars
    mkdir uploads\general
    echo. > uploads\.gitkeep
    echo. > uploads\avatars\.gitkeep
    echo. > uploads\general\.gitkeep
)

REM Install dependencies
echo Installing dependencies...
call npm install
cd frontend && call npm install && cd ..
cd backend && call npm install && cd ..

echo.
echo Setup complete! Your project is ready for GitHub upload.
echo.
echo Next steps:
echo 1. Review and update .env file with your settings
echo 2. Test the application: start-dev.bat
echo 3. Commit and push to GitHub
echo.
pause



