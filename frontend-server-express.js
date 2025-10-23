const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;
const API_TARGET = 'http://localhost:3001';

// Serve static files from the 'dist' directory (Vite build output)
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Serve static files from the 'public' directory (for assets like images)
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // rewrite path
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom headers if needed
    // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    });
    res.end('Something went wrong with the proxy.');
  },
}));

// For any other requests, serve the index.html from the dist folder
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend Server running at http://localhost:${PORT}/`);
  console.log(`📁 Serving from: frontend/dist and frontend/public`);
  console.log(`🔗 API Proxy: /api/* -> ${API_TARGET}/api/*`);
});



