# Docker Setup Guide - Budz Reserve

## Overview

This project uses Docker and Docker Compose to provide a complete containerized environment for the Budz Reserve application. All Docker configurations have been updated to use the latest stable versions as of November 2024.

## Updated Versions

### Base Images
- **Node.js**: `node:22-alpine` (latest current version)
- **MySQL**: `mysql:8.4` (LTS version)
- **Nginx**: `nginx:1.27-alpine` (latest stable)
- **phpMyAdmin**: `phpmyadmin/phpmyadmin:latest` (dev environment only)

### Key Improvements
- ✅ Multi-stage builds for optimized image sizes
- ✅ Non-root users for enhanced security
- ✅ Health checks for all services
- ✅ Proper signal handling with tini
- ✅ Enhanced security headers in Nginx
- ✅ Rate limiting and connection limits
- ✅ Gzip compression enabled
- ✅ Optimized caching strategies
- ✅ Comprehensive .dockerignore patterns

## Project Structure

```
.
├── backend/
│   ├── Dockerfile              # Basic backend Dockerfile
│   ├── Dockerfile.dev          # Development backend
│   └── Dockerfile.prod         # Production backend (multi-stage)
├── frontend/
│   ├── Dockerfile              # Basic frontend Dockerfile
│   ├── Dockerfile.dev          # Development frontend
│   └── Dockerfile.prod         # Production frontend (multi-stage with Nginx)
├── docker/
│   └── nginx/
│       ├── nginx.dev.conf      # Development Nginx config
│       └── nginx.prod.conf     # Production Nginx config
├── docker-compose.yml          # Main compose file
├── docker-compose.dev.yml      # Development compose file
├── docker-compose.prod.yml     # Production compose file
└── .dockerignore               # Files to exclude from Docker builds
```

## Quick Start

### Development Environment

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

**Services Available:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MySQL: localhost:3306
- phpMyAdmin: http://localhost:8080
- Nginx: http://localhost:80

### Production Environment

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

**Services Available:**
- Application: http://localhost:80
- Backend API: http://localhost:3001
- MySQL: localhost:3306
- HTTPS (when configured): https://localhost:443

### Basic Commands

```bash
# Start the default setup
docker-compose up -d

# Rebuild images after code changes
docker-compose up -d --build

# View running containers
docker-compose ps

# Execute commands in containers
docker-compose exec backend npm run migration:run
docker-compose exec frontend npm run build

# Access container shell
docker-compose exec backend sh
docker-compose exec mysql mysql -u root -p

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Remove all containers and volumes
docker-compose down -v
```

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=budz_reserve
MYSQL_USER=budz_user
MYSQL_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_REFRESH_EXPIRES_IN=7d

# API
PORT=3001
API_PREFIX=api
CORS_ORIGIN=http://localhost:3000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# PayMongo
PAYMONGO_SECRET_KEY=sk_test_your_key
PAYMONGO_PUBLIC_KEY=pk_test_your_key
PAYMONGO_WEBHOOK_SECRET=whsk_your_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@budzreserve.com

# Uploads
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

### Frontend Environment Variables

Create `.env` in the frontend directory:

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Budz Reserve
```

## Docker Compose Files

### docker-compose.dev.yml (Development)

Features:
- Hot reload enabled for both frontend and backend
- phpMyAdmin for database management
- Volume mounts for live code updates
- Debug-friendly configurations

### docker-compose.prod.yml (Production)

Features:
- Optimized multi-stage builds
- Health checks enabled
- Security hardened
- No development tools
- Persistent data volumes

### docker-compose.yml (Default)

Balanced configuration suitable for testing production builds locally.

## Service Details

### MySQL (8.4 LTS)

**Features:**
- UTF8MB4 character set for full Unicode support
- Optimized InnoDB settings
- Health checks configured
- Persistent data volume
- Automatic initialization with SQL scripts

**Connection Details:**
- Host: `mysql` (within Docker network) or `localhost` (from host)
- Port: `3306`
- User: Set in environment variables
- Database: `budz_reserve`

### Backend (NestJS on Node.js 22)

**Features:**
- TypeScript compilation
- Auto-restart on file changes (dev mode)
- Non-root user execution
- Health check endpoint: `/api/health`
- Upload directory management

**Build Optimizations:**
- Multi-stage builds
- Production dependencies only in final image
- Tini for proper signal handling
- Efficient layer caching

### Frontend (React + Vite on Node.js 22)

**Development:**
- Vite dev server with HMR
- Port 3000 exposed

**Production:**
- Built static files served by Nginx
- Optimized bundle size
- Fast load times

### Nginx (1.27 Alpine)

**Features:**
- Reverse proxy for frontend and backend
- Rate limiting configured
- Security headers enabled
- Gzip compression
- WebSocket support
- Static asset caching
- Health check endpoint: `/health`

**Security Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy configured

**Rate Limits:**
- General: 10 requests/second
- API: 30 requests/second
- Login: 5 requests/minute
- Connection limit: 10 per IP

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost/health          # Nginx
curl http://localhost:3001/api/health # Backend
```

## Database Management

### Using phpMyAdmin (Development)

Access phpMyAdmin at http://localhost:8080

### Using MySQL CLI

```bash
# Access MySQL from container
docker-compose exec mysql mysql -u root -p

# Export database
docker-compose exec mysql mysqldump -u root -p budz_reserve > backup.sql

# Import database
docker-compose exec -T mysql mysql -u root -p budz_reserve < backup.sql
```

### Running Migrations

```bash
# Generate migration
docker-compose exec backend npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
docker-compose exec backend npm run migration:run

# Revert migration
docker-compose exec backend npm run migration:revert
```

## SSL/HTTPS Configuration (Production)

To enable HTTPS in production:

1. Obtain SSL certificates (e.g., from Let's Encrypt)
2. Place certificates in `./ssl` directory
3. Uncomment HTTPS configuration in `docker/nginx/nginx.prod.conf`
4. Update environment variables to use HTTPS URLs
5. Restart nginx service

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## Performance Tuning

### MySQL Optimization

Current settings in docker-compose:
```yaml
--max_connections=200
--innodb-buffer-pool-size=512M (prod) / 256M (dev)
--innodb-log-file-size=128M (prod)
```

Adjust based on your server resources in the docker-compose files.

### Nginx Worker Processes

Current settings:
- Dev: 2048 connections
- Prod: 4096 connections

Adjust in nginx config files based on your needs.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in docker-compose
```

### Container Won't Start

```bash
# Check logs
docker-compose logs service_name

# Rebuild without cache
docker-compose build --no-cache service_name
docker-compose up -d
```

### Database Connection Issues

```bash
# Ensure MySQL is healthy
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Wait for MySQL to be ready
docker-compose up -d mysql
# Wait 30 seconds
docker-compose up -d backend
```

### Permission Issues with Uploads

```bash
# Fix upload directory permissions (from host)
chmod -R 755 uploads/

# Or from within container
docker-compose exec backend chown -R nestjs:nodejs /app/uploads
```

### Out of Disk Space

```bash
# Remove unused images, containers, volumes
docker system prune -a --volumes

# Check Docker disk usage
docker system df
```

## Maintenance

### Regular Updates

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest images
docker-compose up -d --build

# Remove old images
docker image prune -a
```

### Backup Strategy

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p budz_reserve > backup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Backup environment
cp .env .env.backup
```

### Monitoring

```bash
# Monitor resource usage
docker stats

# Check container health
docker-compose ps

# View all logs
docker-compose logs --tail=100 -f
```

## Security Best Practices

1. **Never commit .env files** - Use .env.example as template
2. **Change default passwords** - Update all credentials in production
3. **Enable HTTPS** - Use SSL certificates in production
4. **Update regularly** - Keep base images up to date
5. **Limit exposed ports** - Only expose necessary ports
6. **Use secrets management** - For production, consider Docker secrets
7. **Regular backups** - Implement automated backup strategy
8. **Monitor logs** - Set up log aggregation and monitoring
9. **Network isolation** - Use Docker networks appropriately
10. **Non-root users** - Already configured in all Dockerfiles

## Development Workflow

1. Make code changes in your local files
2. Changes are automatically reflected in containers (dev mode)
3. Run tests: `docker-compose exec backend npm test`
4. Lint code: `docker-compose exec backend npm run lint`
5. Build for production: `docker-compose -f docker-compose.prod.yml build`

## Production Deployment

1. Update environment variables for production
2. Build production images: `docker-compose -f docker-compose.prod.yml build`
3. Test locally: `docker-compose -f docker-compose.prod.yml up`
4. Push images to registry (if using)
5. Deploy to production server
6. Enable HTTPS/SSL
7. Set up monitoring and logging
8. Configure automated backups

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://nestjs.com/)
- [React Documentation](https://react.dev/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL 8.4 Documentation](https://dev.mysql.com/doc/refman/8.4/en/)

## Support

For issues related to Docker configuration, please check:
1. Container logs: `docker-compose logs -f`
2. Container status: `docker-compose ps`
3. System resources: `docker stats`
4. This documentation file

---

**Last Updated:** November 2024
**Docker Version Required:** 20.10+
**Docker Compose Version Required:** 2.0+



