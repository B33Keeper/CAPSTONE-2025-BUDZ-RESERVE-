@echo off
echo Adding racket images to the frontend directory...

REM Create the equipment images directory if it doesn't exist
if not exist "frontend\public\assets\img\equipments" mkdir "frontend\public\assets\img\equipments"

echo.
echo Please copy your racket images to the following directory:
echo frontend\public\assets\img\equipments\
echo.
echo Required image files:
echo 1. racket-black-red.png
echo 2. racket-silver-white.png
echo 3. racket-dark-frame.png
echo 4. racket-white-silver.png
echo 5. racket-yellow-green.png
echo.
echo After adding the images, the application will automatically display them.
echo.

pause
