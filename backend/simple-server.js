const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Mock API endpoints for frontend
app.get('/api/courts', (req, res) => {
  res.json([
    { id: 1, name: 'Court 1', status: 'available' },
    { id: 2, name: 'Court 2', status: 'available' },
    { id: 3, name: 'Court 3', status: 'booked' }
  ]);
});

app.get('/api/equipment', (req, res) => {
  res.json([
    { id: 1, name: 'Racket', price: 50, available: true },
    { id: 2, name: 'Shoes', price: 30, available: true },
    { id: 3, name: 'Socks', price: 10, available: false }
  ]);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
