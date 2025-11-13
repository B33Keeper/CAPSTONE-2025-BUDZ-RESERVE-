# 🐳 Docker Quick Start - Budz Reserve

## ⚡ Quick Commands

### Development Mode
```bash
# Start everything
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop everything
docker-compose -f docker-compose.dev.yml down
```

### Production Mode
```bash
# Start everything
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop everything
docker-compose -f docker-compose.prod.yml down
```

## 🌐 Service URLs

### Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **MySQL**: localhost:3306
- **phpMyAdmin**: http://localhost:8080
- **Nginx**: http://localhost:80

### Production
- **Application**: http://localhost:80
- **Backend API**: http://localhost:3001/api
- **MySQL**: localhost:3306

## 📋 Common Tasks

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Check Service Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Access Container Shell
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mysql bash
```

### Database Operations
```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u root -p

# Run migrations
docker-compose exec backend npm run migration:run

# Backup database
docker-compose exec mysql mysqldump -u root -p budz_reserve > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p budz_reserve < backup.sql
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (⚠️ deletes data!)
docker-compose down -v

# Remove unused Docker resources
docker system prune -a
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Change the port in docker-compose.yml or stop the conflicting service
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### Container Won't Start
```bash
# Check logs
docker-compose logs service_name

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Failed
```bash
# Ensure MySQL is healthy
docker-compose ps

# Restart MySQL
docker-compose restart mysql

# Wait for MySQL to be ready (check logs)
docker-compose logs -f mysql
```

### Permission Issues
```bash
# Fix upload directory permissions
chmod -R 755 uploads/
```

## 🚀 First Time Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd CAPSTONE-2025-BUDZ-RESERVE
```

2. **Create environment file**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start development environment**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

4. **Check if everything is running**
```bash
docker-compose ps
```

5. **Access the application**
- Open http://localhost:3000 in your browser
- Access phpMyAdmin at http://localhost:8080

## 📦 What's Updated?

- ✅ Node.js 22 (latest)
- ✅ MySQL 8.4 LTS
- ✅ Nginx 1.27
- ✅ Enhanced security headers
- ✅ Rate limiting
- ✅ Health checks
- ✅ Multi-stage builds
- ✅ Non-root users

## 📚 More Information

- **Complete Guide**: See `DOCKER_SETUP.md`
- **Update Details**: See `DOCKER_UPDATE_SUMMARY.md`

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f`
2. Check status: `docker-compose ps`
3. Check resources: `docker stats`
4. Review documentation in `DOCKER_SETUP.md`

---

**Quick Tip:** Use `docker-compose -f docker-compose.dev.yml` for development with hot reload!



