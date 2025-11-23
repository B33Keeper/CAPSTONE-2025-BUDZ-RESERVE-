# 👥 Team Setup Guide - Getting the Same Project

## ✅ What WILL Be the Same

When your team pulls from GitHub and runs Docker, they will get:

1. **✅ All Source Code**
   - Frontend React code (`frontend/src/`)
   - Backend NestJS code (`backend/src/`)
   - All TypeScript/TSX files

2. **✅ Docker Configuration**
   - `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`
   - All Dockerfiles (`backend/Dockerfile*`, `frontend/Dockerfile*`)
   - Nginx configuration files

3. **✅ Database Schema**
   - `database_export.sql` - Database structure and initial data
   - `init-database.sql` - Additional initialization
   - All migrations in `backend/src/database/migrations/`

4. **✅ Project Configuration**
   - `package.json` files
   - `tsconfig.json` files
   - Environment example files (`env.example`, `backend/env.example`, `frontend/env.example`)
   - All configuration files

5. **✅ Directory Structure**
   - Uploads directory structure (created automatically)
   - All folder organization

6. **✅ Dependencies**
   - `package-lock.json` ensures same npm versions
   - Docker images will be built from scratch with same dependencies

## ⚠️ What WILL Be Different

1. **❌ `.env` Files** (Not in Git - by design for security)
   - Each team member needs to create their own `.env` file
   - Copy from `env.example` and configure

2. **❌ Uploaded Files** (Not in Git - by design to keep repo small)
   - Images in `uploads/avatars/`, `uploads/announcements/`, `uploads/gallery/`, `uploads/equipments/`
   - These are gitignored (intentional)
   - Database may reference images that don't exist locally

3. **❌ Database Initial State** (if you have test data)
   - If `database_export.sql` contains test data, everyone gets it
   - But any data added after pushing won't be there

4. **❌ Node Modules** (Not in Git - will be installed fresh)
   - Installed inside Docker containers during build
   - This is correct and expected

## 🚀 What Your Team Needs to Do

### Step 1: Clone the Repository
```bash
git clone <your-github-repo-url>
cd CAPSTONE-2025-BUDZ-RESERVE-
```

### Step 2: Create Environment File
```bash
# Copy the example file
cp env.example .env

# Edit .env with their own values (they can use the defaults for local dev)
# Important: Change JWT_SECRET and other secrets for production
```

### Step 3: Start Docker
```bash
# For development
docker-compose -f docker-compose.dev.yml up -d --build

# OR for production
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Verify Everything Works
```bash
# Check container status
docker-compose ps

# Check logs if needed
docker-compose logs -f
```

### Step 5: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- phpMyAdmin (dev only): http://localhost:8080

## 🎯 Expected Behavior

✅ **Same Application Code** - Everyone gets identical codebase
✅ **Same Database Schema** - Database initialized from `database_export.sql`
✅ **Same Functionality** - All features work the same
✅ **Same Docker Environment** - Same containers, same versions

⚠️ **Missing Uploaded Images** - Image files won't exist (expected)
   - Broken image links are normal until files are re-uploaded
   - Or share uploads folder outside of git

⚠️ **Different Environment Variables** - Each person configures their own `.env`

## 📋 Pre-Push Checklist (For You)

Before pushing to GitHub, ensure:

- [ ] All code changes are committed
- [ ] `database_export.sql` is up to date
- [ ] `env.example` files are up to date
- [ ] `.gitignore` is properly configured (it is!)
- [ ] No sensitive data in code (JWT secrets, API keys, etc.)
- [ ] Docker compose files are correct
- [ ] Documentation is updated if needed

## 🔍 Verification After Pull

Your team can verify everything is the same by checking:

1. **Code Structure**: Same files and folders
2. **Database Schema**: Check tables in phpMyAdmin or database client
3. **Application Features**: All features should work identically
4. **Docker Services**: Same containers running on same ports

## 🆘 Troubleshooting

### Issue: Missing Images/Broken Image Links
**Solution**: This is expected! Uploaded files are not in git. Either:
- Re-upload images through the admin interface
- Share the `uploads/` folder separately (outside git)

### Issue: Environment Variables Not Working
**Solution**: Ensure `.env` file exists and is properly configured:
```bash
cp env.example .env
# Edit .env file
```

### Issue: Port Already in Use
**Solution**: Stop other services using ports 3000, 3001, 3306, or 80:
```bash
# Windows
netstat -ano | findstr :3000
# Then kill the process

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Issue: Database Connection Failed
**Solution**: Wait for MySQL to fully initialize:
```bash
docker-compose logs -f mysql
# Wait for "ready for connections" message
```

## ✅ Summary

**YES, your team will have the same project!**

- ✅ Same code
- ✅ Same database structure  
- ✅ Same Docker setup
- ✅ Same functionality

**Minor differences (expected):**
- Different `.env` files (each person's own)
- Missing uploaded images (by design)
- Fresh database instance (initialized from SQL)

This is exactly how it should be for a Docker-based project! 🎉

