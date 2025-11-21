# Uploads Directory

This directory stores all user-uploaded files including:
- **avatars/** - User profile pictures
- **equipments/** - Equipment images (rackets, etc.)
- **gallery/** - Gallery images
- **announcements/** - Announcement images

## Important Notes

1. **This directory is gitignored** - Uploaded files are NOT committed to the repository (this is intentional to keep the repo size small)

2. **Directory structure is preserved** - The `.gitkeep` files ensure the directory structure exists when you clone/pull the repository

3. **Automatic initialization** - The backend automatically creates these directories on startup if they don't exist

4. **After pulling the repository:**
   - The directory structure will be created automatically
   - You'll need to re-upload images or restore them from a backup
   - Database records may reference images that don't exist locally (this is expected)

## For Team Members

When you pull the repository:
- The upload directories will be created automatically by the backend
- If you see broken images, it's because the actual image files aren't in git (by design)
- You can either:
  1. Upload new images through the admin interface
  2. Ask a team member to share the uploads folder (outside of git)
  3. Restore from a backup if available

## Docker

In Docker, the uploads directory is mounted as a volume, so uploaded files persist across container restarts.

