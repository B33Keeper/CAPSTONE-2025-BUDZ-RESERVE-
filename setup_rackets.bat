@echo off
echo Setting up new badminton racket equipment...

REM Create the equipment images directory if it doesn't exist
if not exist "frontend\public\assets\img\equipments" mkdir "frontend\public\assets\img\equipments"

echo Please add the following image files to frontend\public\assets\img\equipments\:
echo 1. racket-black-red.png
echo 2. racket-silver-white.png
echo 3. racket-dark-frame.png
echo 4. racket-white-silver.png
echo 5. racket-yellow-green.png

echo.
echo After adding the images, run the following command to update the database:
echo mysql -u your_username -p budz_reserve ^< add_racket_equipment.sql

echo.
echo Or if using Docker:
echo docker exec -i your_mysql_container mysql -u root -p budz_reserve ^< add_racket_equipment.sql

pause
