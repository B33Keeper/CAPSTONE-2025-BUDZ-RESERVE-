const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('../uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = '../uploads/avatars';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mock data
const mockCourts = [
  { Court_Id: 1, Court_Name: 'Court 1', Status: 'Available', Price: 220, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 2, Court_Name: 'Court 2', Status: 'Available', Price: 220, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 3, Court_Name: 'Court 3', Status: 'Available', Price: 220, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 4, Court_Name: 'Court 4', Status: 'Available', Price: 220, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 5, Court_Name: 'Court 5', Status: 'Available', Price: 220, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 6, Court_Name: 'Court 6', Status: 'Available', Price: 220, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 7, Court_Name: 'Court 7', Status: 'Available', Price: 200, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 8, Court_Name: 'Court 8', Status: 'Available', Price: 200, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 9, Court_Name: 'Court 9', Status: 'Available', Price: 200, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 10, Court_Name: 'Court 10', Status: 'Available', Price: 200, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 11, Court_Name: 'Court 11', Status: 'Available', Price: 200, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 12, Court_Name: 'Court 12', Status: 'Available', Price: 200, Created_at: '2025-01-01', Updated_at: '2025-01-01' },
  { Court_Id: 13, Court_Name: 'Court 13', Status: 'Available', Price: 250, Created_at: '2025-01-01', Updated_at: '2025-01-01' }
];

const mockEquipment = [
  { id: 1, equipment_name: 'Yonex Racket', price: 50, stocks: 10, image_path: '/assets/img/equipments/racket.png' },
  { id: 2, equipment_name: 'Wilson Racket', price: 60, stocks: 8, image_path: '/assets/img/equipments/racket.png' }
];

const mockTimeSlots = [
  { id: 1, start_time: '08:00:00', end_time: '09:00:00' },
  { id: 2, start_time: '09:00:00', end_time: '10:00:00' },
  { id: 3, start_time: '10:00:00', end_time: '11:00:00' },
  { id: 4, start_time: '11:00:00', end_time: '12:00:00' },
  { id: 5, start_time: '12:00:00', end_time: '13:00:00' },
  { id: 6, start_time: '13:00:00', end_time: '14:00:00' },
  { id: 7, start_time: '14:00:00', end_time: '15:00:00' },
  { id: 8, start_time: '15:00:00', end_time: '16:00:00' },
  { id: 9, start_time: '16:00:00', end_time: '17:00:00' },
  { id: 10, start_time: '17:00:00', end_time: '18:00:00' },
  { id: 11, start_time: '18:00:00', end_time: '19:00:00' },
  { id: 12, start_time: '19:00:00', end_time: '20:00:00' },
  { id: 13, start_time: '20:00:00', end_time: '21:00:00' },
  { id: 14, start_time: '21:00:00', end_time: '22:00:00' },
  { id: 15, start_time: '22:00:00', end_time: '23:00:00' }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock backend is running' });
});

// Auth endpoints
app.get('/api/auth/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Mock user data
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    age: 25,
    sex: 'Male',
    contact_number: '09123456789',
    profile_picture: '/uploads/avatars/1761152763360-446766195.jpg',
    role: 'user'
  };
  
  res.json(mockUser);
});

// Courts endpoints
app.get('/api/courts', (req, res) => {
  res.json(mockCourts);
});

app.get('/api/courts/available', (req, res) => {
  const availableCourts = mockCourts.filter(court => court.Status === 'Available');
  res.json(availableCourts);
});

app.get('/api/courts/:id', (req, res) => {
  const courtId = parseInt(req.params.id);
  const court = mockCourts.find(c => c.Court_Id === courtId);
  
  if (!court) {
    return res.status(404).json({ message: 'Court not found' });
  }
  
  res.json(court);
});

app.post('/api/courts', (req, res) => {
  const newCourt = {
    Court_Id: mockCourts.length + 1,
    Court_Name: req.body.Court_Name,
    Status: req.body.Status,
    Price: req.body.Price,
    Created_at: new Date().toISOString(),
    Updated_at: new Date().toISOString()
  };
  
  mockCourts.push(newCourt);
  res.status(201).json(newCourt);
});

app.patch('/api/courts/:id', (req, res) => {
  const courtId = parseInt(req.params.id);
  const courtIndex = mockCourts.findIndex(c => c.Court_Id === courtId);
  
  if (courtIndex === -1) {
    return res.status(404).json({ message: 'Court not found' });
  }
  
  mockCourts[courtIndex] = { ...mockCourts[courtIndex], ...req.body };
  res.json(mockCourts[courtIndex]);
});

app.delete('/api/courts/:id', (req, res) => {
  const courtId = parseInt(req.params.id);
  const courtIndex = mockCourts.findIndex(c => c.Court_Id === courtId);
  
  if (courtIndex === -1) {
    return res.status(404).json({ message: 'Court not found' });
  }
  
  mockCourts.splice(courtIndex, 1);
  res.json({ message: 'Court deleted successfully' });
});

// Equipment endpoints
app.get('/api/equipment', (req, res) => {
  res.json(mockEquipment);
});

app.get('/api/equipment/available', (req, res) => {
  const availableEquipment = mockEquipment.filter(item => item.stocks > 0);
  res.json(availableEquipment);
});

app.get('/api/equipment/:id', (req, res) => {
  const equipmentId = parseInt(req.params.id);
  const equipment = mockEquipment.find(e => e.id === equipmentId);
  
  if (!equipment) {
    return res.status(404).json({ message: 'Equipment not found' });
  }
  
  res.json(equipment);
});

// Time slots endpoints
app.get('/api/time-slots', (req, res) => {
  res.json(mockTimeSlots);
});

// Reservations endpoints
app.get('/api/reservations', (req, res) => {
  res.json([]);
});

app.get('/api/reservations/my', (req, res) => {
  res.json([]);
});

app.get('/api/reservations/availability', (req, res) => {
  res.json([]);
});

app.post('/api/reservations', (req, res) => {
  res.status(201).json({ message: 'Reservation created successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏓 Courts: http://localhost:${PORT}/api/courts`);
  console.log(`🎾 Equipment: http://localhost:${PORT}/api/equipment`);
});
