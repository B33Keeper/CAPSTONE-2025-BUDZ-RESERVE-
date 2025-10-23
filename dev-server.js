const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Serve static files from public directory
app.use('/assets', express.static(path.join(__dirname, 'frontend/public/assets')));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  secure: false,
}));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Serve any other files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

app.listen(PORT, () => {
  console.log(`🚀 Development Server running at http://localhost:${PORT}/`);
  console.log(`📁 Serving from: frontend directory`);
  console.log(`🔗 API Proxy: /api/* -> http://localhost:3001/api/*`);
});



