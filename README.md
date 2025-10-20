# 🏸 Budz Reserve - Badminton Court Booking System

A full-stack web application for booking badminton courts, built with React, NestJS, and MySQL. This system allows users to reserve courts, rent equipment, and manage their profiles with a modern, responsive interface.

## 🚀 Features

### 🔐 Authentication & Security
- **User Authentication**: Secure login/registration with JWT tokens and database persistence
- **Role-Based Access Control**: Admin and user roles with different permissions
- **Forgot Password**: Email-based password reset with OTP verification
- **Password Security**: Bcrypt hashing and secure password validation
- **Session Management**: JWT token refresh and automatic logout

### 🏸 Court Management
- **Court Booking System**: Real-time court availability with 12 courts available
- **Dynamic Pricing**: Different pricing tiers for courts (Courts 1-6: ₱250, Courts 7-9: ₱220, Courts 10-11: ₱180)
- **Time Slot Management**: Flexible time slot booking with availability checking
- **Maintenance Mode**: Courts can be marked as maintenance with visual indicators
- **Booking History**: Complete booking history and reservation management

### 🎾 Equipment & Services
- **Equipment Rental**: Badminton equipment rental with inventory management
- **Equipment Catalog**: Rackets, shoes, socks, and other badminton gear
- **Inventory Tracking**: Real-time equipment availability and status
- **Equipment Pricing**: Dynamic pricing for different equipment types

### 👤 User Management
- **Profile Management**: User profile with photo upload, change password, and settings
- **Avatar Upload**: Profile picture upload with image optimization
- **User Dashboard**: Personal dashboard with booking history and statistics
- **Account Settings**: Comprehensive user account management

### 👨‍💼 Admin Dashboard
- **Admin Panel**: Complete administrative dashboard with statistics
- **User Management**: View and manage all registered users
- **Analytics**: Real-time statistics and data visualization
- **Charts & Reports**: Monthly overview charts and reservation status pie charts
- **User Statistics**: Total user count, daily reservations, and sales tracking
- **Responsive Design**: Mobile-friendly admin interface

### 💳 Payment Integration
- **PayMongo Integration**: Complete payment gateway integration
- **Secure Payments**: PCI-compliant payment processing
- **Payment Status Tracking**: Real-time payment status updates
- **Payment History**: Complete payment transaction history
- **Refund Management**: Automated refund processing

### 📧 Communication
- **Email System**: Automated email notifications and communications
- **OTP Verification**: Email-based OTP for password reset
- **Email Templates**: Professional Handlebars-based email templates
- **SMTP Configuration**: Gmail SMTP integration for reliable email delivery

### 🎨 User Interface
- **Responsive Design**: Mobile-first design that works perfectly on desktop, laptop, and mobile devices
- **Modern UI/UX**: Enhanced visual design with animations and smooth interactions
- **Interactive Components**: Hover effects, transitions, and micro-interactions
- **Custom Scrollbars**: Styled scrollbars for better user experience
- **Loading States**: Comprehensive loading indicators and skeleton screens

### 📋 Legal & Compliance
- **Terms & Conditions**: Integrated terms and conditions modal for booking
- **Privacy Policy**: Comprehensive privacy policy integration
- **Payment Policies**: Payment, refund, and cancellation policy information
- **Legal Compliance**: GDPR-ready data handling and user consent

### 🗄️ Data Management
- **Database Integration**: Full MySQL database integration with persistent data storage
- **TypeORM**: Advanced ORM with entity relationships and migrations
- **Data Validation**: Comprehensive input validation and sanitization
- **Data Backup**: Automated database backup and recovery

### 🐳 DevOps & Deployment
- **Docker Support**: Complete Docker containerization for easy deployment
- **Docker Compose**: Multi-container orchestration for development and production
- **Nginx Reverse Proxy**: Production-ready reverse proxy configuration
- **Environment Configuration**: Comprehensive environment variable management
- **CI/CD Ready**: GitHub Actions ready for automated deployment

### 🔧 Technical Features
- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Rate Limiting**: API rate limiting and throttling
- **Error Handling**: Comprehensive error handling and logging
- **File Upload**: Secure file upload with validation
- **CORS Configuration**: Cross-origin resource sharing setup
- **Health Checks**: Application health monitoring endpoints

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling and responsive design
- **React Router DOM** for client-side routing
- **Axios** for HTTP API calls with interceptors
- **Zustand** for state management
- **React Hook Form** for form handling
- **Zod** for form validation
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **NestJS** with TypeScript
- **MySQL 8.0** database with TypeORM
- **JWT** for authentication and authorization
- **Passport** for authentication strategies
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Class Validator** for DTO validation
- **Class Transformer** for data transformation
- **Nodemailer** for email services
- **Handlebars** for email templates
- **Swagger/OpenAPI** for API documentation
- **Throttler** for rate limiting

### Payment Integration
- **PayMongo** payment gateway
- **RESTful API** integration
- **Webhook handling** for payment status updates

### DevOps & Infrastructure
- **Docker** & **Docker Compose** for containerization
- **Nginx** reverse proxy for production
- **MySQL 8.0** containerized database
- **Node.js 18** Alpine Linux containers
- **Multi-stage Docker builds** for optimization

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Git** for version control
- **GitHub** for repository hosting

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **Git**

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/B33Keeper/CAPSTONE-2025-BUDZ-RESERVE-.git
   cd CAPSTONE-2025-BUDZ-RESERVE-
   git checkout react-version
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

### Option 2: Manual Setup (Alternative)

1. **Start MySQL service** (XAMPP or local MySQL)
2. **Create database**
   ```sql
   CREATE DATABASE budz_reserve;
   ```
3. **Import database schema**
   ```bash
   mysql -u root -p budz_reserve < database_export.sql
   ```
4. **Start backend server**
   ```bash
   node simple-backend.js
   ```
5. **Start frontend server**
   ```bash
   node simple-static-server.js
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
│   │   │   ├── modals/      # Modal components
│   │   │   ├── Header.tsx   # Navigation header
│   │   │   └── Footer.tsx   # Site footer
│   │   ├── pages/          # Page components
│   │   │   ├── AdminDashboard.tsx  # Admin panel
│   │   │   ├── BookingPage.tsx     # Court booking
│   │   │   ├── LoginPage.tsx       # User authentication
│   │   │   └── ForgotPasswordPage.tsx  # Password reset
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API services and utilities
│   │   ├── store/          # Zustand state management
│   │   └── App.tsx         # Main application component
│   ├── public/             # Static assets
│   └── dist/               # Built frontend
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication module
│   │   │   ├── users/      # User management
│   │   │   ├── courts/     # Court management
│   │   │   ├── equipment/  # Equipment management
│   │   │   ├── reservations/ # Booking system
│   │   │   ├── payments/   # Payment processing
│   │   │   ├── upload/     # File upload handling
│   │   │   └── time-slots/ # Time slot management
│   │   ├── database/       # Database configuration
│   │   ├── templates/      # Email templates
│   │   └── main.ts         # Application entry point
│   ├── uploads/            # File uploads directory
│   └── dist/               # Compiled backend
├── docker/                 # Docker configurations
│   └── nginx/             # Nginx reverse proxy configs
├── Assets/                 # Static assets and images
├── database_export.sql     # Database schema
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
├── PAYMONGO_SETUP.md      # Payment integration guide
└── README.md              # This file
```

## 👨‍💼 Admin Features

### Dashboard Overview
- **Real-time Statistics**: Live user count, daily reservations, and sales tracking
- **Interactive Charts**: Monthly overview bar charts and reservation status pie charts
- **User Management**: View and manage all registered users
- **Responsive Design**: Mobile-friendly admin interface with collapsible sidebar

### Admin Capabilities
- **User Management**: View total users, active users, and user statistics
- **Court Management**: Add, edit, and manage court availability and pricing
- **Equipment Management**: Manage badminton equipment inventory
- **Reservation Oversight**: View and manage all court reservations
- **Payment Monitoring**: Track payment status and transaction history
- **System Analytics**: Monitor system performance and usage statistics

### Security Features
- **Role-based Access**: Admin-only access to sensitive operations
- **JWT Authentication**: Secure admin authentication
- **API Protection**: Protected endpoints with proper authorization
- **Audit Logging**: Track admin actions and system changes

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=budz_reserve

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@budzreserve.com

# Application Configuration
PORT=3001
NODE_ENV=development
API_PREFIX=api
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_your_paymongo_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_paymongo_public_key_here
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

## 🎯 API Endpoints

### Authentication & User Management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/forgot-password` - Send password reset OTP
- `POST /api/auth/verify-otp` - Verify OTP for password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/users/count` - Get total user count (Admin)
- `GET /api/users/active-count` - Get active user count (Admin)

### Court Management
- `GET /api/courts` - Get all courts
- `GET /api/courts/availability` - Check court availability
- `POST /api/courts` - Create new court (Admin)
- `PUT /api/courts/:id` - Update court details (Admin)
- `DELETE /api/courts/:id` - Delete court (Admin)

### Equipment Management
- `GET /api/equipment` - Get all equipment
- `POST /api/equipment` - Add new equipment (Admin)
- `PUT /api/equipment/:id` - Update equipment details (Admin)
- `DELETE /api/equipment/:id` - Delete equipment (Admin)

### Reservations
- `GET /api/reservations` - Get user reservations
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/reservations/admin` - Get all reservations (Admin)

### Time Slots
- `GET /api/time-slots` - Get available time slots
- `POST /api/time-slots` - Create time slot (Admin)
- `PUT /api/time-slots/:id` - Update time slot (Admin)

### File Uploads
- `POST /api/upload/avatar` - Upload profile picture
- `POST /api/upload/general` - Upload general files

### Payment Processing
- `POST /api/payment/create-checkout` - Create PayMongo checkout session
- `GET /api/payment/status/:paymentIntentId` - Get payment status
- `GET /api/payments` - Get payment history
- `GET /api/payments/:id` - Get specific payment details
- `PATCH /api/payments/:id/status` - Update payment status (Admin)

### Health & Monitoring
- `GET /api/health` - Application health check
- `GET /api/docs` - API documentation (Swagger)

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

- **B33Keeper** - *Initial work* - [B33Keeper](https://github.com/B33Keeper)

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