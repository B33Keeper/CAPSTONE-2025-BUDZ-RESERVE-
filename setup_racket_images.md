# Setting Up New Badminton Racket Images

## Instructions for Adding the New Racket Images

Based on the images you provided, you need to add the following image files to the `frontend/public/assets/img/equipments/` directory:

### Required Image Files:
1. `racket-black-red.png` - Black/red badminton racket (diagonal orientation)
2. `racket-silver-white.png` - Silver/white badminton racket (diagonal orientation) 
3. `racket-dark-frame.png` - Dark frame with white grip (diagonal orientation)
4. `racket-white-silver.png` - White head with silver frame (diagonal orientation)
5. `racket-yellow-green.png` - Yellow/green badminton racket (diagonal orientation)

### Steps to Add Images:
1. Save each of the 5 racket images you provided with the exact filenames listed above
2. Place them in the `frontend/public/assets/img/equipments/` directory
3. Run the SQL script `add_racket_equipment.sql` to add the new equipment entries to the database

### Database Update:
The SQL script will:
- Add 5 new equipment entries with different racket types
- Update the existing racket entry with a more descriptive name
- Set appropriate prices, stock levels, and descriptions for each racket type

### Expected Result:
After completing these steps, the "Rent a Racket" page will display 6 different badminton racket options with the images you provided, each with unique styling and pricing.
