# 🏸 Budz Reserve - React Version

A modern badminton court reservation system built with React, NestJS, and Docker.

## 🚀 Quick Start Guide

### Prerequisites
- **Docker Desktop** - Download from [docker.com](https://docker.com)
- **Git** - For cloning the repository

### Team Setup Instructions

#### Step 1: Clone the Repository
```bash
# Clone the repository
git clone <your-github-repo-url>
cd BudzReserve
```

#### Step 2: Switch to React Version
```bash
# Switch to the React version branch
git checkout react-version
```

#### Step 3: Run the Application
```bash
# Start all services (Frontend + Backend + Database + Nginx)
docker-compose up -d

# Check if everything is running
docker-compose ps

# View logs if needed
docker-compose logs -f
```

#### Step 4: Verify Everything is Working
```bash
# Check database initialization
docker-compose logs mysql

# Check backend logs
docker-compose logs backend

# Check frontend logs
docker-compose logs frontend
```

### Database Setup
The database will be automatically initialized with:
- ✅ Complete database schema
- ✅ All existing data from production (12 courts, 6 users, 25 reservations)
- ✅ Proper user accounts and permissions
- ✅ Sample courts and equipment data
- ✅ Payment records and reservation history

### Access the Application
- **🌐 Frontend:** http://localhost:3000
- **🔧 Backend API:** http://localhost:3001/api
- **📚 API Documentation:** http://localhost:3001/api/docs
- **💾 Database:** localhost:3306

## 📋 Common Commands

### Stop the Application
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (if you want to reset database)
docker-compose down -v
```

### Update the Application
```bash
# Pull latest changes
git pull origin react-version

# Rebuild and restart
docker-compose up -d --build
```

### Development Workflow
```bash
# View real-time logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql

# Check service status
docker-compose ps

# Access database directly
docker-compose exec mysql mysql -u root -p budz_reserve
```

### Reset Everything (Fresh Start)
```bash
# Stop and remove everything
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Start fresh
docker-compose up -d --build
```

### Development Mode (Optional)
If you want to run without Docker:
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, TypeScript, MySQL, TypeORM
- **Infrastructure:** Docker, Docker Compose, Nginx
- **Security:** JWT, Rate Limiting, Security Headers

## 📱 Features
- User Authentication & Registration
- Court Booking System
- Reservation Management
- Profile Management
- Payment Integration
- Responsive Design
- Real-time Updates

## 🆘 Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3306

# Stop conflicting services or change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check if MySQL is running
docker-compose logs mysql

# Restart database
docker-compose restart mysql

# Check database initialization
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

#### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

#### Backend API Not Responding
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check if backend is healthy
curl http://localhost:3001/health
```

### Debug Commands
```bash
# Check container status
docker-compose ps

# View logs for specific service
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Full reset
docker-compose down -v
docker-compose up -d --build

# Check Docker system resources
docker system df
docker system prune
```

## 👥 Team Collaboration

### Git Workflow
```bash
# Before starting work
git pull origin react-version

# After making changes
git add .
git commit -m "feat: Add new feature"
git push origin react-version
```

### Code Standards
- Use TypeScript for all new code
- Follow existing component structure
- Add proper error handling
- Include JSDoc comments for functions
- Test changes locally before pushing

### Database Changes
- Never modify the database directly
- Use TypeORM migrations for schema changes
- Test migrations locally first
- Coordinate with team for major changes
