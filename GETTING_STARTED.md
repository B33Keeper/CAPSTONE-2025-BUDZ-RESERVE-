# 🚀 Quick Start Guide

## Prerequisites
- Docker Desktop installed
- XAMPP installed (for phpMyAdmin only)

## 1. Start XAMPP (Apache Only)
- Open XAMPP Control Panel
- Start **Apache** service only
- **DO NOT start MySQL** - We'll use Docker's MySQL
- Keep XAMPP running

## 2. Start the Application
```bash
# Clone and navigate to project
git clone https://github.com/your-username/budz-reserve.git
cd budz-reserve

# Start all services (includes MySQL)
docker compose -f docker-compose.dev.yml up -d

# Check status
docker compose -f docker-compose.dev.yml ps
```

## 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database**: http://localhost/phpmyadmin

## 4. Database Access (Docker MySQL)
- **URL**: http://localhost/phpmyadmin
- **Server**: 127.0.0.1:3307
- **Username**: budz_user
- **Password**: budz_password
- **Database**: budz_reserve

## 5. Stop Everything
```bash
# Stop all containers (including MySQL)
docker compose -f docker-compose.dev.yml down

# Stop Nginx if needed (for phpMyAdmin access)
docker stop budz-reserve-nginx
```

## Troubleshooting
- **Port conflicts**: Stop Nginx with `docker stop budz-reserve-nginx`
- **Database issues**: Restart MySQL with `docker compose -f docker-compose.dev.yml restart mysql`
- **Reset everything**: `docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up -d`

That's it! 🎉
