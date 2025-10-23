const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Decode URL to handle spaces and special characters
  const decodedUrl = decodeURIComponent(req.url);
  console.log(`Decoded URL: ${decodedUrl}`);
  
  let filePath = '';
  
  // Handle root path
  if (decodedUrl === '/') {
    filePath = './frontend/dist/index.html';
  }
  // Handle API requests
  else if (decodedUrl.startsWith('/api/')) {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: req.url, // Use original URL for API requests
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
  // Handle assets from dist
  else if (decodedUrl.startsWith('/assets/')) {
    filePath = './frontend/dist' + decodedUrl;
  }
  // Handle other files from public
  else {
    filePath = './frontend/public' + decodedUrl;
  }
  
  console.log(`Serving file: ${filePath}`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('404 Not Found');
    return;
  }
  
  // Get file extension
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
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf'
  };
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Read and serve file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.log(`Error reading file: ${error}`);
      res.writeHead(500);
      res.end('Server Error');
    } else {
      console.log(`Serving file successfully: ${filePath}`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Simple Static Server running at http://localhost:${PORT}/`);
  console.log(`📁 Serving from: frontend/dist and frontend/public`);
  console.log(`🔗 API Proxy: /api/* -> http://localhost:3001/api/*`);
});
