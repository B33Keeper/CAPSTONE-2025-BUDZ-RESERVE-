const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  
  // Handle root path
  if (filePath === './') {
    filePath = './frontend/dist/index.html';
  }
  
  // Handle assets and other files from dist directory
  if (req.url.startsWith('/assets/') || req.url.startsWith('/vite.svg')) {
    filePath = './frontend/dist' + req.url;
  }
  
  // Handle other static files that might be in public directory
  if (req.url.startsWith('/') && !req.url.startsWith('/api/') && !req.url.startsWith('/assets/')) {
    // Try public directory first for images and other assets
    filePath = './frontend/public' + req.url;
  }
  
  // Handle API requests - proxy to backend
  if (req.url.startsWith('/api/')) {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    req.pipe(proxy);
    return;
  }
  
  // Handle static files
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Try to serve from public directory
        const publicPath = './frontend/public' + req.url;
        fs.readFile(publicPath, (publicError, publicContent) => {
          if (publicError) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('404 Not Found', 'utf-8');
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(publicContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Frontend Server running at http://localhost:${PORT}/`);
  console.log(`📁 Serving from: frontend/dist and frontend/public`);
  console.log(`🔗 API Proxy: /api/* -> http://localhost:3001/api/*`);
});
