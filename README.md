# 🏸 Budz Reserve - Badminton Court Booking System

A full-stack web application for booking badminton courts, built with React, NestJS, and MySQL. This system allows users to reserve courts, rent equipment, and manage their profiles with a modern, responsive interface.

## 🚀 Features

- **User Authentication**: Secure login/registration with JWT tokens
- **Court Booking**: Real-time court availability and booking system
- **Equipment Rental**: Badminton equipment rental with inventory management
- **Profile Management**: User profile with photo upload and settings
- **Responsive Design**: Mobile-first design that works on all devices
- **Admin Dashboard**: Court and equipment management
- **Payment Integration**: Ready for payment gateway integration

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** for API calls
- **Zustand** for state management

### Backend
- **NestJS** with TypeScript
- **MySQL** database
- **JWT** for authentication
- **Multer** for file uploads
- **Class Validator** for validation

### DevOps
- **Docker** & **Docker Compose**
- **Nginx** reverse proxy
- **MySQL 8.0** containerized database

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **Git**

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/budz-reserve.git
   cd budz-reserve
   ```

2. **Set up environment variables**
   ```bash
   # Copy the template and edit with your values
   cp env.template .env
   ```

3. **Start the application**
   
   **For Development:**
   ```bash
   # Windows
   start-dev.bat
   
   # Linux/Mac
   ./start-dev.sh
   ```
   
   **For Production:**
   ```bash
   # Windows
   start-prod.bat
   
   # Linux/Mac
   ./start-prod.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api

### Option 2: Manual Setup

1. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Frontend dependencies
   cd frontend && npm install
   
   # Backend dependencies
   cd ../backend && npm install
   ```

2. **Set up MySQL database**
   ```sql
   CREATE DATABASE budz_reserve;
   ```

3. **Import database schema**
   ```bash
   mysql -u root -p budz_reserve < database_export.sql
   ```

4. **Configure environment variables**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   
   # Frontend
   cp frontend/env.example frontend/.env
   ```

5. **Start the servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run start:dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

## 🐳 Docker Configuration

### Development
- Uses `docker-compose.dev.yml`
- Hot reloading enabled
- Volume mounts for live code changes
- MySQL on port 3306
- Backend on port 3001
- Frontend on port 3000

### Production
- Uses `docker-compose.yml`
- Optimized builds
- Nginx reverse proxy
- SSL ready (configure in nginx)
- Persistent data volumes

## 📁 Project Structure

```
budz-reserve/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # API services
│   │   └── store/          # State management
│   ├── public/             # Static assets
│   └── dist/               # Built frontend
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── database/       # Database config
│   │   └── main.ts         # Entry point
│   └── uploads/            # File uploads
├── docker/                 # Docker configurations
│   └── nginx/             # Nginx configs
├── database_export.sql     # Database schema
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── README.md              # This file
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=budz_reserve
MYSQL_USER=budz_user
MYSQL_PASSWORD=budz_password

# Backend Configuration
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=budz_user
DB_PASSWORD=budz_password
DB_DATABASE=budz_reserve
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Budz Reserve
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Courts
- `GET /api/courts` - Get all courts
- `GET /api/courts/availability` - Check court availability

### Equipment
- `GET /api/equipment` - Get all equipment

### Time Slots
- `GET /api/time-slots` - Get available time slots

### Uploads
- `POST /api/upload/avatar` - Upload profile picture

## 🧪 Testing

```bash
# Run backend tests
cd backend && npm run test

# Run frontend tests
cd frontend && npm run test

# Run e2e tests
npm run test:e2e
```

## 📦 Building for Production

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Or use Docker
docker-compose up --build
```

## 🚀 Deployment

### Using Docker
1. Set up your production environment variables
2. Run `docker-compose up -d`
3. Configure your domain and SSL certificates

### Manual Deployment
1. Build the frontend: `cd frontend && npm run build`
2. Build the backend: `cd backend && npm run build`
3. Set up a reverse proxy (Nginx)
4. Configure your database
5. Start the backend server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Badminton court management inspiration
- React and NestJS communities
- All contributors and testers

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact us at support@budzreserve.com
- Check the documentation in the `/docs` folder

---

**Happy Coding! 🏸✨**