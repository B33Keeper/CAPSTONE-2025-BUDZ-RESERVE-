# Database Image Storage Migration Guide

## Overview
This guide will help you migrate from file-based image storage to database-based storage (base64) for:
- User profile pictures
- Gallery images
- Equipment/racket images

## Step 1: Database Schema Changes

Run these SQL commands in your database (using DB Gate or MySQL client):

### 1.1 Update Users Table
```sql
-- Change profile_picture column from VARCHAR to LONGTEXT
ALTER TABLE users 
MODIFY COLUMN profile_picture LONGTEXT NULL;
```

### 1.2 Update Gallery Table
```sql
-- Change image_path column from VARCHAR(500) to LONGTEXT
ALTER TABLE gallery 
MODIFY COLUMN image_path LONGTEXT NOT NULL;
```

### 1.3 Update Equipments Table
```sql
-- Change image_path column from VARCHAR(255) to LONGTEXT
-- Note: Default value will be removed, we'll handle defaults in code
ALTER TABLE equipments 
MODIFY COLUMN image_path LONGTEXT NULL;
```

## Step 2: Migration of Existing Images (Optional)

If you have existing images stored as file paths, you can migrate them to base64:

```sql
-- This is a placeholder - you'll need to write a script to:
-- 1. Read each file path
-- 2. Convert file to base64
-- 3. Update the database

-- For now, existing images will remain as file paths
-- New uploads will be stored as base64
```

## Step 3: Verify Changes

After running the SQL commands, verify the changes:

```sql
-- Check users table structure
DESCRIBE users;

-- Check gallery table structure
DESCRIBE gallery;

-- Check equipments table structure
DESCRIBE equipments;
```

You should see `profile_picture`, `image_path` columns as `LONGTEXT` type.

## Important Notes

1. **Existing Images**: Existing file paths will remain in the database. The code will handle both:
   - Base64 images (new format): `data:image/jpeg;base64,/9j/4AAQ...`
   - File paths (old format): `/uploads/avatars/image.jpg`
   - External URLs: `https://example.com/image.jpg`

2. **Backward Compatibility**: The code is designed to handle both formats:
   - If it's a base64 string, it will be used directly
   - If it's a file path, it will try to load from file system (for backward compatibility)
   - If it's a URL, it will be used as-is

3. **Image Size**: Base64 images are ~33% larger than binary. For very large images, consider:
   - Compressing images before upload
   - Setting max file size limits
   - Using image optimization

## Troubleshooting

### Error: "Data too long for column"
- Make sure you changed the column type to `LONGTEXT` (not `TEXT` or `VARCHAR`)
- `LONGTEXT` can store up to 4GB of data

### Error: "Column cannot be null"
- Make sure you set columns as `NULL` if they can be empty
- Or provide default values in the code

### Images not displaying
- Check if the base64 string starts with `data:image/`
- Verify the image data is complete (not truncated)
- Check browser console for errors

