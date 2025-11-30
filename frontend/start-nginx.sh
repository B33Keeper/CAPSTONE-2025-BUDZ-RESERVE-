#!/bin/sh
# Railway startup script for nginx
# Railway provides PORT environment variable - we need to configure nginx to use it

PORT=${PORT:-80}

echo "Configuring nginx to listen on port ${PORT}"

# Replace port 80 with Railway's PORT in nginx config
sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
  echo "ERROR: Nginx configuration test failed!"
  exit 1
fi

echo "Starting nginx on port ${PORT}..."
# Start nginx in foreground
exec nginx -g "daemon off;"

