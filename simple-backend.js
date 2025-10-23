const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.raw({ type: 'multipart/form-data', limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads/avatars';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USERNAME || 'budz_user',
  password: process.env.DB_PASSWORD || 'budz_password',
  database: process.env.DB_DATABASE || 'budz_reserve'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database');
});

// Users are now stored in MySQL database

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  // Find user by username or email in database
  const loginQuery = 'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1';
  db.query(loginQuery, [username, username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'User not found'
      });
    }
    
    const user = results[0];
    
    if (user.password !== password) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'Incorrect password'
      });
    }
    
    // Create a simple token (in real app, use JWT)
    const token = `token_${user.id}_${Date.now()}`;
    
    res.json({
      message: 'Login successful',
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        age: user.age,
        sex: user.sex,
        contact_number: user.contact_number,
        profile_picture: user.profile_picture
      }
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, age, sex, username, email, password, contact_number } = req.body;
  
  console.log('Registration attempt:', { name, age, sex, username, email, contact_number });
  
  // Check if user already exists
  const checkUserQuery = 'SELECT id FROM users WHERE username = ? OR email = ?';
  db.query(checkUserQuery, [username, email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(400).json({ 
        message: 'User already exists',
        error: 'Username or email already taken'
      });
    }
    
    // Create new user in database
    const insertUserQuery = `
      INSERT INTO users (name, age, sex, username, email, password, contact_number, is_active, is_verified, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
    `;
    
    db.query(insertUserQuery, [name, age || 0, sex || 'Male', username, email, password, contact_number || ''], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      const newUserId = result.insertId;
      
      // Create a simple token (in real app, use JWT)
      const token = `token_${newUserId}_${Date.now()}`;
      
      res.status(201).json({
        message: 'User created successfully',
        access_token: token,
        user: {
          id: newUserId,
          username: username,
          email: email,
          name: name,
          age: age || 0,
          sex: sex || 'Male',
          contact_number: contact_number || ''
        }
      });
    });
  });
});

app.get('/api/auth/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Simple token validation (in real app, verify JWT)
  const userId = token.split('_')[1];
  
  const profileQuery = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
  db.query(profileQuery, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const user = results[0];
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      age: user.age,
      sex: user.sex,
      contact_number: user.contact_number,
      profile_picture: user.profile_picture
    });
  });
});

// Profile picture upload endpoint (base64)
app.post('/api/upload/avatar', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Simple token validation
  const userId = token.split('_')[1];
  
  const userQuery = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
  db.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('Upload request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Authorization header:', req.headers.authorization);
    
    let image;
    
    // Handle both JSON and multipart form data
    if (req.headers['content-type']?.includes('application/json')) {
      // JSON request
      const { image: jsonImage } = req.body || {};
      image = jsonImage;
    } else if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Multipart form data - try to extract from raw body
      try {
        const body = req.body.toString();
        console.log('Raw body sample:', body.substring(0, 200));
        
        // Look for base64 data in the multipart body
        const base64Match = body.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (base64Match) {
          image = `data:image/png;base64,${base64Match[1]}`;
          console.log('Found base64 data in multipart body');
        } else {
          // Try to find any base64 data
          const anyBase64Match = body.match(/([A-Za-z0-9+/=]{100,})/);
          if (anyBase64Match) {
            image = `data:image/png;base64,${anyBase64Match[1]}`;
            console.log('Found base64 data without data URL prefix');
          }
        }
      } catch (error) {
        console.error('Error parsing multipart body:', error);
      }
    }
    
    if (!image) {
      console.log('No image provided in request body');
      return res.status(400).json({ message: 'No image provided' });
    }
    
    console.log('Image data received, length:', image.length);
    
    try {
      // Handle base64 image data
      let base64Data = image;
      let extension = 'png';
      
      // Check if it's a data URL
      if (image.startsWith('data:image/')) {
        const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          extension = matches[1];
          base64Data = matches[2];
        }
      }
      
      // Generate unique filename
      const filename = `avatar-${userId}-${Date.now()}.${extension}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Save the file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      // Update user's profile picture in database
      const profilePicturePath = `/uploads/avatars/${filename}`;
      const updateQuery = 'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?';
      
      db.query(updateQuery, [profilePicturePath, userId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        console.log('Profile picture uploaded:', { userId, profilePicturePath });
        
        res.json({
          message: 'Profile picture uploaded successfully',
          profilePicture: profilePicturePath
        });
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  });
});

// Profile picture upload endpoint (base64)
app.post('/api/upload/avatar', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Simple token validation
  const userId = token.split('_')[1];
  
  const userQuery = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
  db.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('Upload request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Authorization header:', req.headers.authorization);
    
    let image;
    
    // Handle both JSON and multipart form data
    if (req.headers['content-type']?.includes('application/json')) {
      // JSON request
      const { image: jsonImage } = req.body || {};
      image = jsonImage;
    } else if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Multipart form data - try to extract from raw body
      try {
        const body = req.body.toString();
        console.log('Raw body sample:', body.substring(0, 200));
        
        // Look for base64 data in the multipart body
        const base64Match = body.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (base64Match) {
          image = `data:image/png;base64,${base64Match[1]}`;
          console.log('Found base64 data in multipart body');
        } else {
          // Try to find any base64 data
          const anyBase64Match = body.match(/([A-Za-z0-9+/=]{100,})/);
          if (anyBase64Match) {
            image = `data:image/png;base64,${anyBase64Match[1]}`;
            console.log('Found base64 data without data URL prefix');
          }
        }
      } catch (error) {
        console.error('Error parsing multipart body:', error);
      }
    }
    
    if (!image) {
      console.log('No image provided in request body');
      return res.status(400).json({ message: 'No image provided' });
    }
    
    console.log('Image data received, length:', image.length);
    
    try {
      // Handle base64 image data
      let base64Data = image;
      let extension = 'png';
      
      // Check if it's a data URL
      if (image.startsWith('data:image/')) {
        const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          extension = matches[1];
          base64Data = matches[2];
        }
      }
      
      // Generate unique filename
      const filename = `avatar-${userId}-${Date.now()}.${extension}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Save the file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      // Update user's profile picture in database
      const profilePicturePath = `/uploads/avatars/${filename}`;
      const updateQuery = 'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?';
      
      db.query(updateQuery, [profilePicturePath, userId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        console.log('Profile picture uploaded:', { userId, profilePicturePath });
        
        res.json({
          message: 'Profile picture uploaded successfully',
          profilePicture: profilePicturePath
        });
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  });
});

// Profile picture upload endpoint (multipart form data)
app.post('/api/upload/avatar-multipart', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Simple token validation
  const userId = token.split('_')[1];
  
  const userQuery = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
  db.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('Multipart upload request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Authorization header:', req.headers.authorization);
    
    // For multipart form data, we need to parse the raw body
    const body = req.body.toString();
    console.log('Raw body length:', body.length);
    
    // Look for base64 image data in the multipart body
    const base64Match = body.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    
    if (!base64Match) {
      console.log('No base64 image found in multipart body');
      return res.status(400).json({ message: 'No image provided' });
    }
    
    const image = `data:image/png;base64,${base64Match[1]}`;
    console.log('Image data extracted, length:', image.length);
    
    try {
      // Handle base64 image data
      let base64Data = image;
      let extension = 'png';
      
      // Check if it's a data URL
      if (image.startsWith('data:image/')) {
        const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          extension = matches[1];
          base64Data = matches[2];
        }
      }
      
      // Generate unique filename
      const filename = `avatar-${userId}-${Date.now()}.${extension}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Save the file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      // Update user's profile picture in database
      const profilePicturePath = `/uploads/avatars/${filename}`;
      const updateQuery = 'UPDATE users SET profile_picture = ?, updated_at = NOW() WHERE id = ?';
      
      db.query(updateQuery, [profilePicturePath, userId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        console.log('Profile picture uploaded:', { userId, profilePicturePath });
        
        res.json({
          message: 'Profile picture uploaded successfully',
          profilePicture: profilePicturePath
        });
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Error uploading image' });
    }
  });
});

// Mock endpoints for testing
app.get('/api/courts', (req, res) => {
  res.json([
    { 
      Court_Id: 1, 
      Court_Name: 'Court 1', 
      Status: 'Available', 
      Price: 100,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    { 
      Court_Id: 2, 
      Court_Name: 'Court 2', 
      Status: 'Available', 
      Price: 100,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    { 
      Court_Id: 3, 
      Court_Name: 'Court 3', 
      Status: 'Maintenance', 
      Price: 100,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    { 
      Court_Id: 4, 
      Court_Name: 'Court 4', 
      Status: 'Available', 
      Price: 100,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    }
  ]);
});

app.get('/api/courts/available', (req, res) => {
  res.json([
    { 
      Court_Id: 1, 
      Court_Name: 'Court 1', 
      Status: 'Available', 
      Price: 100,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    { 
      Court_Id: 2, 
      Court_Name: 'Court 2', 
      Status: 'Available', 
      Price: 100,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    { 
      Court_Id: 4, 
      Court_Name: 'Court 4', 
      Status: 'Available', 
      Price: 100,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    }
  ]);
});

app.get('/api/courts/:id', (req, res) => {
  const courtId = parseInt(req.params.id);
  const court = {
    Court_Id: courtId,
    Court_Name: `Court ${courtId}`,
    Status: 'Available',
    Price: 100,
    Created_at: new Date().toISOString(),
    Updated_at: new Date().toISOString()
  };
  res.json(court);
});

app.get('/api/equipment', (req, res) => {
  res.json([
    { 
      id: 1, 
      equipment_name: 'Racket', 
      stocks: 10, 
      price: 50, 
      description: 'Professional badminton racket',
      status: 'Available',
      image_path: '/assets/img/equipments/racket.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 2, 
      equipment_name: 'Shoes', 
      stocks: 8, 
      price: 30, 
      description: 'Badminton shoes',
      status: 'Available',
      image_path: '/assets/img/equipments/shoes.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 3, 
      equipment_name: 'Socks', 
      stocks: 20, 
      price: 10, 
      description: 'Sports socks',
      status: 'Available',
      image_path: '/assets/img/equipments/socks.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
});

app.get('/api/equipment/available', (req, res) => {
  res.json([
    { 
      id: 1, 
      equipment_name: 'Racket', 
      stocks: 10, 
      price: 50, 
      description: 'Professional badminton racket',
      status: 'Available',
      image_path: '/assets/img/equipments/racket.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 2, 
      equipment_name: 'Shoes', 
      stocks: 8, 
      price: 30, 
      description: 'Badminton shoes',
      status: 'Available',
      image_path: '/assets/img/equipments/shoes.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: 3, 
      equipment_name: 'Socks', 
      stocks: 20, 
      price: 10, 
      description: 'Sports socks',
      status: 'Available',
      image_path: '/assets/img/equipments/socks.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
});

app.get('/api/equipment/:id', (req, res) => {
  const equipmentId = parseInt(req.params.id);
  const equipment = {
    id: equipmentId,
    equipment_name: `Equipment ${equipmentId}`,
    stocks: 10,
    price: 50,
    description: 'Equipment description',
    status: 'Available',
    image_path: '/assets/img/equipments/equipment.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  res.json(equipment);
});

app.get('/api/time-slots', (req, res) => {
  res.json([
    { 
      id: 1, 
      start_time: '06:00:00', 
      end_time: '07:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 2, 
      start_time: '07:00:00', 
      end_time: '08:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 3, 
      start_time: '08:00:00', 
      end_time: '09:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 4, 
      start_time: '09:00:00', 
      end_time: '10:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 5, 
      start_time: '10:00:00', 
      end_time: '11:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 6, 
      start_time: '11:00:00', 
      end_time: '12:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 7, 
      start_time: '12:00:00', 
      end_time: '13:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 8, 
      start_time: '13:00:00', 
      end_time: '14:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 9, 
      start_time: '14:00:00', 
      end_time: '15:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 10, 
      start_time: '15:00:00', 
      end_time: '16:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 11, 
      start_time: '16:00:00', 
      end_time: '17:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 12, 
      start_time: '17:00:00', 
      end_time: '18:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 13, 
      start_time: '18:00:00', 
      end_time: '19:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 14, 
      start_time: '19:00:00', 
      end_time: '20:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 15, 
      start_time: '20:00:00', 
      end_time: '21:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    },
    { 
      id: 16, 
      start_time: '21:00:00', 
      end_time: '22:00:00', 
      is_active: true,
      created_at: new Date().toISOString()
    }
  ]);
});

app.get('/api/reservations', (req, res) => {
  res.json([]);
});

app.get('/api/reservations/my', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const userId = token.split('_')[1];
  // Return empty array for now - in real app, filter by user ID
  res.json([]);
});

app.get('/api/reservations/availability', (req, res) => {
  const { courtId, date } = req.query;
  
  // Mock availability data - in real app, check actual reservations
  const mockAvailability = [
    { timeSlot: '06:00-07:00', available: true },
    { timeSlot: '07:00-08:00', available: true },
    { timeSlot: '08:00-09:00', available: false },
    { timeSlot: '09:00-10:00', available: true },
    { timeSlot: '10:00-11:00', available: true },
    { timeSlot: '11:00-12:00', available: false },
    { timeSlot: '12:00-13:00', available: true },
    { timeSlot: '13:00-14:00', available: true },
    { timeSlot: '14:00-15:00', available: true },
    { timeSlot: '15:00-16:00', available: false },
    { timeSlot: '16:00-17:00', available: true },
    { timeSlot: '17:00-18:00', available: true },
    { timeSlot: '18:00-19:00', available: true },
    { timeSlot: '19:00-20:00', available: false },
    { timeSlot: '20:00-21:00', available: true },
    { timeSlot: '21:00-22:00', available: true }
  ];
  
  res.json(mockAvailability);
});

app.post('/api/reservations', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const userId = token.split('_')[1];
  const reservationData = req.body;
  
  // Mock reservation creation
  const newReservation = {
    Reservation_Id: Date.now(),
    User_ID: parseInt(userId),
    ...reservationData,
    Status: 'Pending',
    Reference_Number: `REF-${Date.now()}`,
    Created_at: new Date().toISOString(),
    Updated_at: new Date().toISOString()
  };
  
  console.log('New reservation created:', newReservation);
  
  res.status(201).json(newReservation);
});

// Change password endpoint
app.patch('/api/users/change-password', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Simple token validation
  const userId = token.split('_')[1];
  
  const userQuery = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
  db.query(userQuery, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const user = results[0];
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Check if current password is correct
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Check if new password is different from current password
    if (user.password === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }
    
    // Update password in database
    const updatePasswordQuery = 'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?';
    db.query(updatePasswordQuery, [newPassword, userId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      console.log('Password changed for user:', user.username);
      
      res.json({
        message: 'Password changed successfully'
      });
    });
  });
});

// Courts endpoints
app.get('/api/courts', (req, res) => {
  const mockCourts = [
    {
      Court_Id: 1,
      Court_Name: 'Court 1',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 2,
      Court_Name: 'Court 2',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 3,
      Court_Name: 'Court 3',
      Status: 'Maintenance',
      Price: 300,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 4,
      Court_Name: 'Court 4',
      Status: 'Available',
      Price: 700,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 5,
      Court_Name: 'Court 5',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 6,
      Court_Name: 'Court 6',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 7,
      Court_Name: 'Court 7',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 8,
      Court_Name: 'Court 8',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 9,
      Court_Name: 'Court 9',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 10,
      Court_Name: 'Court 10',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 11,
      Court_Name: 'Court 11',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    },
    {
      Court_Id: 12,
      Court_Name: 'Court 12',
      Status: 'Available',
      Price: 500,
      Created_at: new Date().toISOString(),
      Updated_at: new Date().toISOString()
    }
  ];
  
  res.json(mockCourts);
});

// Time slots endpoints
app.get('/api/time-slots', (req, res) => {
  const mockTimeSlots = [
    { id: 1, start_time: '08:00:00', end_time: '09:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 2, start_time: '09:00:00', end_time: '10:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 3, start_time: '10:00:00', end_time: '11:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 4, start_time: '11:00:00', end_time: '12:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 5, start_time: '12:00:00', end_time: '13:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 6, start_time: '13:00:00', end_time: '14:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 7, start_time: '14:00:00', end_time: '15:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 8, start_time: '15:00:00', end_time: '16:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 9, start_time: '16:00:00', end_time: '17:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 10, start_time: '17:00:00', end_time: '18:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 11, start_time: '18:00:00', end_time: '19:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 12, start_time: '19:00:00', end_time: '20:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 13, start_time: '20:00:00', end_time: '21:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 14, start_time: '21:00:00', end_time: '22:00:00', is_active: true, created_at: new Date().toISOString() },
    { id: 15, start_time: '22:00:00', end_time: '23:00:00', is_active: true, created_at: new Date().toISOString() }
  ];
  
  res.json(mockTimeSlots);
});

// Equipment endpoints
app.get('/api/equipment', (req, res) => {
  const mockEquipment = [
    {
      id: 1,
      equipment_name: 'Badminton Racket',
      stocks: 20,
      price: 50,
      description: 'Professional badminton racket',
      status: 'Available',
      image_path: '/assets/img/equipments/racket.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      equipment_name: 'Badminton Shoes',
      stocks: 15,
      price: 30,
      description: 'Non-marking badminton shoes',
      status: 'Available',
      image_path: '/assets/img/equipments/shoes.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      equipment_name: 'Badminton Socks',
      stocks: 50,
      price: 10,
      description: 'Comfortable sports socks',
      status: 'Available',
      image_path: '/assets/img/equipments/socks.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  res.json(mockEquipment);
});

// Court availability endpoint
app.get('/api/courts/availability', (req, res) => {
  const { date, courtId } = req.query;
  
  // Mock availability data
  const mockAvailability = {
    date: date || new Date().toISOString().split('T')[0],
    courts: [
      {
        courtId: 1,
        timeSlots: [
          { time: '06:00-07:00', available: true, price: 500 },
          { time: '07:00-08:00', available: true, price: 500 },
          { time: '08:00-09:00', available: false, price: 500 },
          { time: '09:00-10:00', available: true, price: 500 },
          { time: '10:00-11:00', available: true, price: 500 },
          { time: '11:00-12:00', available: false, price: 500 },
          { time: '12:00-13:00', available: true, price: 500 },
          { time: '13:00-14:00', available: true, price: 500 },
          { time: '14:00-15:00', available: true, price: 500 },
          { time: '15:00-16:00', available: false, price: 500 },
          { time: '16:00-17:00', available: true, price: 500 },
          { time: '17:00-18:00', available: true, price: 500 },
          { time: '18:00-19:00', available: true, price: 500 },
          { time: '19:00-20:00', available: false, price: 500 },
          { time: '20:00-21:00', available: true, price: 500 },
          { time: '21:00-22:00', available: true, price: 500 }
        ]
      },
      {
        courtId: 2,
        timeSlots: [
          { time: '06:00-07:00', available: true, price: 500 },
          { time: '07:00-08:00', available: false, price: 500 },
          { time: '08:00-09:00', available: true, price: 500 },
          { time: '09:00-10:00', available: true, price: 500 },
          { time: '10:00-11:00', available: false, price: 500 },
          { time: '11:00-12:00', available: true, price: 500 },
          { time: '12:00-13:00', available: true, price: 500 },
          { time: '13:00-14:00', available: false, price: 500 },
          { time: '14:00-15:00', available: true, price: 500 },
          { time: '15:00-16:00', available: true, price: 500 },
          { time: '16:00-17:00', available: false, price: 500 },
          { time: '17:00-18:00', available: true, price: 500 },
          { time: '18:00-19:00', available: true, price: 500 },
          { time: '19:00-20:00', available: true, price: 500 },
          { time: '20:00-21:00', available: false, price: 500 },
          { time: '21:00-22:00', available: true, price: 500 }
        ]
      },
      {
        courtId: 3,
        timeSlots: [
          { time: '06:00-07:00', available: false, price: 300 },
          { time: '07:00-08:00', available: false, price: 300 },
          { time: '08:00-09:00', available: false, price: 300 },
          { time: '09:00-10:00', available: false, price: 300 },
          { time: '10:00-11:00', available: false, price: 300 },
          { time: '11:00-12:00', available: false, price: 300 },
          { time: '12:00-13:00', available: false, price: 300 },
          { time: '13:00-14:00', available: false, price: 300 },
          { time: '14:00-15:00', available: false, price: 300 },
          { time: '15:00-16:00', available: false, price: 300 },
          { time: '16:00-17:00', available: false, price: 300 },
          { time: '17:00-18:00', available: false, price: 300 },
          { time: '18:00-19:00', available: false, price: 300 },
          { time: '19:00-20:00', available: false, price: 300 },
          { time: '20:00-21:00', available: false, price: 300 },
          { time: '21:00-22:00', available: false, price: 300 }
        ]
      },
      {
        courtId: 4,
        timeSlots: [
          { time: '06:00-07:00', available: true, price: 700 },
          { time: '07:00-08:00', available: true, price: 700 },
          { time: '08:00-09:00', available: true, price: 700 },
          { time: '09:00-10:00', available: false, price: 700 },
          { time: '10:00-11:00', available: true, price: 700 },
          { time: '11:00-12:00', available: true, price: 700 },
          { time: '12:00-13:00', available: false, price: 700 },
          { time: '13:00-14:00', available: true, price: 700 },
          { time: '14:00-15:00', available: true, price: 700 },
          { time: '15:00-16:00', available: true, price: 700 },
          { time: '16:00-17:00', available: false, price: 700 },
          { time: '17:00-18:00', available: true, price: 700 },
          { time: '18:00-19:00', available: true, price: 700 },
          { time: '19:00-20:00', available: true, price: 700 },
          { time: '20:00-21:00', available: false, price: 700 },
          { time: '21:00-22:00', available: true, price: 700 }
        ]
      }
    ]
  };
  
  res.json(mockAvailability);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Backend Server running on: http://localhost:${PORT}`);
  console.log(`📚 Health Check: http://localhost:${PORT}/api/health`);
});
