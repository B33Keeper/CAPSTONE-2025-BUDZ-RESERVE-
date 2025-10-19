const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 3000;
const API_TARGET = 'http://localhost:3001';

// Serve static files from the 'dist' directory (Vite build output)
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Serve static files from the 'public' directory (for assets like images)
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Simple API proxy
app.use('/api', (req, res) => {
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
});

// For any other requests, serve the index.html from the dist folder
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend Server running at http://localhost:${PORT}/`);
  console.log(`📁 Serving from: frontend/dist and frontend/public`);
  console.log(`🔗 API Proxy: /api/* -> ${API_TARGET}/api/*`);
});
