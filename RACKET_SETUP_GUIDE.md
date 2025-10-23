# Badminton Racket Images Setup Guide

## Overview
This guide will help you add the 5 different badminton racket images you provided to the "Rent a Racket" page.

## Files Created
1. `add_racket_equipment.sql` - Database script to add new equipment entries
2. `setup_racket_images.md` - Detailed instructions for image setup
3. `setup_rackets.sh` - Linux/Mac setup script
4. `setup_rackets.bat` - Windows setup script

## Step-by-Step Instructions

### Step 1: Add the Images
Save each of your 5 badminton racket images with these exact filenames in the `frontend/public/assets/img/equipments/` directory:

1. **racket-black-red.png** - Black/red badminton racket (diagonal orientation)
2. **racket-silver-white.png** - Silver/white badminton racket (diagonal orientation)
3. **racket-dark-frame.png** - Dark frame with white grip (diagonal orientation)
4. **racket-white-silver.png** - White head with silver frame (diagonal orientation)
5. **racket-yellow-green.png** - Yellow/green badminton racket (diagonal orientation)

### Step 2: Update the Database
Run the SQL script to add the new equipment entries:

**Option A: Direct MySQL**
```bash
mysql -u your_username -p budz_reserve < add_racket_equipment.sql
```

**Option B: Using Docker**
```bash
docker exec -i your_mysql_container mysql -u root -p budz_reserve < add_racket_equipment.sql
```

**Option C: Using phpMyAdmin**
1. Open phpMyAdmin
2. Select the `budz_reserve` database
3. Go to the SQL tab
4. Copy and paste the contents of `add_racket_equipment.sql`
5. Click "Go" to execute

### Step 3: Restart the Application
After updating the database, restart your application to see the changes:

**Using Docker:**
```bash
docker-compose down
docker-compose up -d
```

**Using npm:**
```bash
# Stop current processes and restart
npm run dev
```

## Expected Results

After completing these steps, the "Rent a Racket" page will display:

1. **Standard Badminton Racket** (original) - ₱150/hour
2. **Professional Badminton Racket - Black/Red** - ₱180/hour (15 available)
3. **Premium Badminton Racket - Silver/White** - ₱200/hour (12 available)
4. **Elite Badminton Racket - Dark Frame** - ₱160/hour (18 available)
5. **Championship Badminton Racket - White/Silver** - ₱220/hour (10 available)
6. **Tournament Badminton Racket - Yellow/Green** - ₱190/hour (14 available)

## Troubleshooting

### Images Not Showing
- Check that image files are in the correct directory: `frontend/public/assets/img/equipments/`
- Verify filenames match exactly (case-sensitive)
- Clear browser cache and refresh

### Database Issues
- Ensure the `image_path` column exists in the `equipments` table
- Check that the SQL script executed without errors
- Verify the database connection

### Application Not Starting
- Check Docker logs: `docker-compose logs`
- Ensure all required services are running
- Verify database connection settings

## Support
If you encounter any issues, check the application logs and ensure all image files are properly placed in the correct directory.
