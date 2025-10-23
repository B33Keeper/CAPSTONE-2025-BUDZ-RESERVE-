const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads/avatars';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MySQL connection (matches docker-compose dev env)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USERNAME || 'budz_user',
  password: process.env.DB_PASSWORD || 'budz_password',
  database: process.env.DB_DATABASE || 'budz_reserve'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('✅ Connected to MySQL');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// File upload (profile picture) using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = (file.originalname.split('.').pop() || 'png').toLowerCase();
    const userId = (req.headers.authorization || '').replace('Bearer ', '').split('_')[1] || 'anon';
    cb(null, `avatar-${userId}-${Date.now()}.${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/upload/avatar', upload.single('file'), (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  const userId = token.split('_')[1];
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const profilePicturePath = `/uploads/avatars/${req.file.filename}`;
  const q = 'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?';
  db.query(q, [profilePicturePath, userId], (err) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    return res.json({ message: 'Profile picture uploaded successfully', profilePicture: profilePicturePath });
  });
});

// Auth endpoints (simple, dev-only; plain-text passwords)
app.post('/api/auth/register', (req, res) => {
  const { name, age, sex, username, email, password, contact_number } = req.body || {};
  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const checkUser = 'SELECT id FROM users WHERE username = ? OR email = ?';
  db.query(checkUser, [username, email], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (rows.length > 0) return res.status(400).json({ message: 'User already exists' });

    const insert = `INSERT INTO users (name, age, sex, username, email, password, contact_number, is_active, is_verified, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`;
    db.query(insert, [name, age || 0, sex || 'Male', username, email, password, contact_number || ''], (err2, result) => {
      if (err2) return res.status(500).json({ message: 'Database error' });
      const token = `token_${result.insertId}_${Date.now()}`;
      return res.status(201).json({
        access_token: token,
        user: { id: result.insertId, username, email, name, age: age || 0, sex: sex || 'Male', contact_number: contact_number || '' }
      });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });
  const q = 'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1';
  db.query(q, [username, username], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    if (user.password !== password) return res.status(401).json({ message: 'Invalid credentials' });
    const token = `token_${user.id}_${Date.now()}`;
    return res.json({
      access_token: token,
      user: { id: user.id, username: user.username, email: user.email, name: user.name, age: user.age, sex: user.sex, contact_number: user.contact_number, profile_picture: user.profile_picture }
    });
  });
});

app.get('/api/auth/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  const userId = token.split('_')[1];
  const q = 'SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1';
  db.query(q, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid token' });
    const u = rows[0];
    return res.json({ id: u.id, username: u.username, email: u.email, name: u.name, age: u.age, sex: u.sex, contact_number: u.contact_number, profile_picture: u.profile_picture });
  });
});

// Change password
app.patch('/api/users/change-password', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  const userId = token.split('_')[1];
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
  if (!newPassword) return res.status(400).json({ message: 'New password is required' });
  const q = 'SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1';
  db.query(q, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid token' });
    const user = rows[0];
    if (user.password !== currentPassword) return res.status(400).json({ message: 'Current password is incorrect' });
    if (currentPassword === newPassword) return res.status(400).json({ message: 'New password must be different' });
    const uq = 'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?';
    db.query(uq, [newPassword, userId], (err2) => {
      if (err2) return res.status(500).json({ message: 'Database error' });
      return res.json({ message: 'Password changed successfully' });
    });
  });
});

// Minimal mocks used by UI (courts/equipment)
app.get('/api/courts', (req, res) => {
  const courts = []
  for (let i = 1; i <= 12; i++) {
    courts.push({
      Court_Id: i,
      Court_Name: `Court ${i}`,
      Status: 'Available',
      Price: i <= 6 ? 250 : (i <= 9 ? 220 : 180),
    })
  }
  res.json(courts)
});

app.get('/api/equipment', (req, res) => {
  res.json([
    { id: 1, equipment_name: 'Racket', stocks: 10, price: 50, status: 'Available', image_path: '/assets/img/equipments/racket.png' },
    { id: 2, equipment_name: 'Shoes', stocks: 8, price: 30, status: 'Available', image_path: '/assets/img/equipments/shoes.png' },
    { id: 3, equipment_name: 'Socks', stocks: 20, price: 10, status: 'Available', image_path: '/assets/img/equipments/socks.png' }
  ]);
});

// Time slots endpoint expected by frontend
app.get('/api/time-slots', (req, res) => {
  const mockTimeSlots = [];
  for (let h = 8; h < 23; h++) {
    const pad = (n) => n.toString().padStart(2, '0');
    mockTimeSlots.push({
      id: h,
      start_time: `${pad(h)}:00:00`,
      end_time: `${pad(h+1)}:00:00`,
      is_active: true,
      created_at: new Date().toISOString()
    });
  }
  res.json(mockTimeSlots);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
