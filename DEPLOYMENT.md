# 🚀 Deployment Guide

This guide covers different deployment options for the Budz Reserve application.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Domain name (for production)
- SSL certificate (for production)
- Basic knowledge of server administration

## 🐳 Docker Deployment (Recommended)

### Development Environment

1. **Clone and setup**
   ```bash
   git clone https://github.com/yourusername/budz-reserve.git
   cd budz-reserve
   cp env.template .env
   ```

2. **Configure environment**
   Edit `.env` file with your settings:
   ```env
   MYSQL_ROOT_PASSWORD=your-secure-password
   MYSQL_PASSWORD=your-secure-password
   JWT_SECRET=your-super-secret-jwt-key
   ```

3. **Start services**
   ```bash
   # Windows
   start-dev.bat
   
   # Linux/Mac
   ./start-dev.sh
   
   # Or manually
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Production Environment

1. **Setup production environment**
   ```bash
   cp env.template .env
   # Edit .env with production values
   ```

2. **Configure production settings**
   ```env
   NODE_ENV=production
   MYSQL_ROOT_PASSWORD=super-secure-password
   MYSQL_PASSWORD=super-secure-password
   JWT_SECRET=production-jwt-secret-key
   CORS_ORIGIN=https://yourdomain.com
   VITE_API_URL=https://yourdomain.com/api
   ```

3. **Deploy**
   ```bash
   # Windows
   start-prod.bat
   
   # Linux/Mac
   ./start-prod.sh
   
   # Or manually
   docker-compose up --build -d
   ```

4. **Verify deployment**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## 🌐 Nginx Configuration

### Basic Configuration

Create `/etc/nginx/sites-available/budz-reserve`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /path/to/your/app/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL Configuration

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Update Nginx config**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
       ssl_prefer_server_ciphers off;

       # Rest of your configuration...
   }

   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

## 🗄️ Database Management

### Backup Database

```bash
# Create backup
docker exec budz-reserve-mysql mysqldump -u root -p budz_reserve > backup.sql

# Restore backup
docker exec -i budz-reserve-mysql mysql -u root -p budz_reserve < backup.sql
```

### Database Migration

```bash
# Run migrations
docker exec budz-reserve-backend npm run migration:run

# Generate new migration
docker exec budz-reserve-backend npm run migration:generate -- -n MigrationName
```

## 📊 Monitoring

### Health Checks

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Database performance
docker exec budz-reserve-mysql mysqladmin -u root -p status
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :3001
   netstat -tulpn | grep :3306
   ```

2. **Database connection issues**
   ```bash
   # Check MySQL logs
   docker-compose logs mysql
   
   # Test database connection
   docker exec budz-reserve-mysql mysql -u root -p -e "SHOW DATABASES;"
   ```

3. **Build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Permission issues**
   ```bash
   # Fix upload directory permissions
   sudo chown -R 1001:1001 uploads/
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Rebuild and restart**
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

3. **Run database migrations**
   ```bash
   docker exec budz-reserve-backend npm run migration:run
   ```

### Regular Maintenance

1. **Clean up Docker**
   ```bash
   # Remove unused containers and images
   docker system prune -a
   
   # Remove unused volumes
   docker volume prune
   ```

2. **Database maintenance**
   ```bash
   # Optimize database
   docker exec budz-reserve-mysql mysql -u root -p -e "OPTIMIZE TABLE users, courts, equipment, reservations;"
   ```

3. **Log rotation**
   ```bash
   # Configure log rotation in docker-compose.yml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## 🚨 Security Considerations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable SSL/TLS**
4. **Regular security updates**
5. **Database access restrictions**
6. **File upload validation**
7. **Rate limiting**
8. **CORS configuration**

## 📞 Support

If you encounter issues during deployment:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Check port availability
4. Review Docker and Docker Compose versions
5. Open an issue on GitHub

---

**Happy Deploying! 🚀**
