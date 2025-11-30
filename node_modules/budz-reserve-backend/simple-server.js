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

// Announcements endpoints (read-only for modal)
const mapAnnouncementRow = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  image_url: row.image_url,
  announcement_type: row.announcement_type || (row.image_url ? 'image' : 'text'),
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_active: !!row.is_active,
  creator: row.creator_name || row.creator_username
    ? {
        name: row.creator_name,
        username: row.creator_username,
      }
    : null,
});

app.get('/api/announcements/active', (req, res) => {
  const q = `
    SELECT a.*, u.name AS creator_name, u.username AS creator_username
    FROM announcements a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.is_active = 1
    ORDER BY a.created_at DESC
  `;

  db.query(q, (err, rows) => {
    if (err) {
      console.error('Error fetching announcements:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    return res.json(rows.map(mapAnnouncementRow));
  });
});

// Queue Players endpoints
app.get('/api/queue-players', (req, res) => {
  const q = 'SELECT * FROM queue_players ORDER BY created_at DESC';
  db.query(q, (err, rows) => {
    if (err) {
      console.error('Error fetching queue players:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    const players = rows.map(row => ({
      id: row.id,
      name: row.name,
      sex: row.sex,
      skill: row.skill,
      gamesPlayed: row.games_played || 0,
      status: row.status || 'In Queue',
      createdAt: row.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
      lastPlayed: row.last_played ? row.last_played.toISOString() : null
    }));
    return res.json(players);
  });
});

// Queue Matches endpoints
app.post('/api/queue-matches', (req, res) => {
  const { gameType, courtId, teamA, teamB } = req.body;
  
  if (!gameType || !teamA || !teamB) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  if (teamA.length !== 2 || teamB.length !== 2) {
    return res.status(400).json({ message: 'Each team must have exactly 2 players' });
  }
  
  // Validate all player IDs are unique
  const allPlayerIds = [...teamA.map(p => p.id), ...teamB.map(p => p.id)];
  const uniquePlayerIds = [...new Set(allPlayerIds)];
  if (uniquePlayerIds.length !== 4) {
    return res.status(400).json({ message: 'All players must be unique' });
  }
  
  // Get court name if courtId provided
  let courtName = null;
  if (courtId) {
    const courtQuery = 'SELECT name FROM queueing_courts WHERE id = ?';
    db.query(courtQuery, [courtId], (err, rows) => {
      if (!err && rows.length > 0) {
        courtName = rows[0].name;
      }
      insertMatch();
    });
  } else {
    insertMatch();
  }
  
  function insertMatch() {
    const insertQuery = `
      INSERT INTO queue_matches (game_type, status, team_a, team_b, court_id, court_name, created_at, updated_at)
      VALUES (?, 'pending', ?, ?, ?, ?, NOW(), NOW())
    `;
    
    db.query(insertQuery, [
      gameType,
      JSON.stringify(teamA),
      JSON.stringify(teamB),
      courtId || null,
      courtName
    ], (err, result) => {
      if (err) {
        console.error('Error creating queue match:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      // Update games_played for all players
      const placeholders = allPlayerIds.map(() => '?').join(',');
      const updateGamesQuery = `UPDATE queue_players SET games_played = COALESCE(games_played, 0) + 1, last_played = CURDATE() WHERE id IN (${placeholders})`;
      db.query(updateGamesQuery, allPlayerIds, (updateErr) => {
        if (updateErr) {
          console.error('Error updating games played:', updateErr);
        }
      });
      
      const match = {
        id: result.insertId,
        gameType,
        status: 'pending',
        teamA,
        teamB,
        courtId: courtId || null,
        courtName,
        startedAt: null,
        completedAt: null,
        winner: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json(match);
    });
  }
});

app.get('/api/queue-matches', (req, res) => {
  const { status } = req.query;
  let q = 'SELECT * FROM queue_matches';
  const params = [];
  
  if (status) {
    q += ' WHERE status = ?';
    params.push(status);
  }
  
  q += ' ORDER BY created_at DESC';
  
  db.query(q, params, (err, rows) => {
    if (err) {
      console.error('Error fetching queue matches:', err);
      // If table doesn't exist, return empty array instead of error
      if (err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('queue_matches table does not exist, returning empty array');
        return res.json([]);
      }
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    try {
      const matches = rows.map(row => {
        let teamA, teamB;
        try {
          teamA = typeof row.team_a === 'string' ? JSON.parse(row.team_a) : row.team_a;
        } catch (e) {
          console.error('Error parsing teamA:', e);
          teamA = [];
        }
        try {
          teamB = typeof row.team_b === 'string' ? JSON.parse(row.team_b) : row.team_b;
        } catch (e) {
          console.error('Error parsing teamB:', e);
          teamB = [];
        }
        
        return {
          id: row.id,
          gameType: row.game_type,
          status: row.status,
          teamA,
          teamB,
          courtId: row.court_id,
          courtName: row.court_name,
          startedAt: row.started_at ? row.started_at.toISOString() : null,
          completedAt: row.completed_at ? row.completed_at.toISOString() : null,
          winner: row.winner || null,
          createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? row.updated_at.toISOString() : new Date().toISOString()
        };
      });
      
      return res.json(matches);
    } catch (parseErr) {
      console.error('Error processing queue matches:', parseErr);
      return res.status(500).json({ message: 'Error processing matches', error: parseErr.message });
    }
  });
});

app.patch('/api/queue-matches/:id/complete', (req, res) => {
  const { id } = req.params;
  const { winner } = req.body;
  
  if (!winner || !['teamA', 'teamB', 'draw'].includes(winner)) {
    return res.status(400).json({ message: 'Invalid winner. Must be teamA, teamB, or draw' });
  }
  
  const q = `
    UPDATE queue_matches 
    SET status = 'completed', completed_at = NOW(), winner = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  db.query(q, [winner, id], (err, result) => {
    if (err) {
      console.error('Error completing queue match:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Fetch updated match
    db.query('SELECT * FROM queue_matches WHERE id = ?', [id], (fetchErr, rows) => {
      if (fetchErr || rows.length === 0) {
        return res.status(500).json({ message: 'Error fetching updated match' });
      }
      
      const row = rows[0];
      const match = {
        id: row.id,
        gameType: row.game_type,
        status: row.status,
        teamA: typeof row.team_a === 'string' ? JSON.parse(row.team_a) : row.team_a,
        teamB: typeof row.team_b === 'string' ? JSON.parse(row.team_b) : row.team_b,
        courtId: row.court_id,
        courtName: row.court_name,
        startedAt: row.started_at ? row.started_at.toISOString() : null,
        completedAt: row.completed_at ? row.completed_at.toISOString() : null,
        winner: row.winner,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
      
      return res.json(match);
    });
  });
});

app.patch('/api/queue-matches/:id/cancel', (req, res) => {
  const { id } = req.params;
  
  const q = `
    UPDATE queue_matches 
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = ?
  `;
  
  db.query(q, [id], (err, result) => {
    if (err) {
      console.error('Error cancelling queue match:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Fetch updated match
    db.query('SELECT * FROM queue_matches WHERE id = ?', [id], (fetchErr, rows) => {
      if (fetchErr || rows.length === 0) {
        return res.status(500).json({ message: 'Error fetching updated match' });
      }
      
      const row = rows[0];
      const match = {
        id: row.id,
        gameType: row.game_type,
        status: row.status,
        teamA: typeof row.team_a === 'string' ? JSON.parse(row.team_a) : row.team_a,
        teamB: typeof row.team_b === 'string' ? JSON.parse(row.team_b) : row.team_b,
        courtId: row.court_id,
        courtName: row.court_name,
        startedAt: row.started_at ? row.started_at.toISOString() : null,
        completedAt: row.completed_at ? row.completed_at.toISOString() : null,
        winner: row.winner,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      };
      
      return res.json(match);
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
