# 🏸 Budz Reserve - Badminton Court Booking System

A comprehensive full-stack badminton court reservation system built with React, NestJS, and MySQL. Features real-time court availability, equipment rental management, payment processing, queue management, and comprehensive admin dashboard.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## 🚨 CRITICAL: READ THIS FIRST!

> **⚠️ PAYMENT SYSTEM WILL NOT WORK WITHOUT NGROK!**
> 
> **ALL TEAMMATES MUST COMPLETE THE NGROK SETUP BEFORE TESTING PAYMENTS!**
> 
> **Scroll down to the "🚨 IMPORTANT: ngrok Setup for Payment Integration" section and follow ALL steps!**
> 
> **Without ngrok:**
> - ❌ Payments will process but reservations won't be saved
> - ❌ No email receipts will be sent
> - ❌ Webhook processing will fail
> - ❌ Incomplete payment flow

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Project](#-running-the-project)
- [Docker Setup](#-docker-setup)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
- **Court Booking System**: Real-time availability checking and reservation management
- **Payment Integration**: PayMongo payment gateway with webhook support and multiple payment methods (GCash, GrabPay, Maya, Visa)
- **Equipment Rental**: Racket rental system with stock management and automated return reminders
- **Queue Management**: Player queueing system for court matches with automated scheduling
- **Admin Dashboard**: Comprehensive analytics and management tools
- **Sales Reporting**: Detailed sales reports with filtering and PDF export
- **User Management**: Role-based access control (Admin, User)
- **Email Notifications**: Automated email receipts, rental reminders, and reservation notifications
- **Reservation Notifications**: Automated email reminders before reservations and notifications when reservations end
- **Modern UI/UX**: Enhanced login and signup pages with improved user experience

### 📊 Admin Features
- **Dashboard**: Daily metrics, monthly trends, and quick access links
- **Court Management**: Dynamic court creation and management
- **Equipment Management**: Stock tracking and availability management
- **Sales Reports**: Period-based reporting (Daily, Weekly, Monthly, Quarterly, Yearly)
- **Reservation Management**: Create and manage reservations with automated notifications
- **Announcement System**: Create and manage announcements with modal display
- **Suggestion Management**: View and manage user suggestions
- **Automated Scheduling**: Background jobs for reservation reminders and queue management

### 👤 User Features
- **Court Booking**: Browse and book available courts with multiple payment options
- **Equipment Rental**: Rent rackets with quantity and duration selection
- **Reservation History**: View past and upcoming reservations
- **Queue Management**: Join player queues and participate in matches
- **Profile Management**: Update profile and view booking history
- **Email Notifications**: Receive automated reminders for upcoming reservations and rental returns
- **Modern Authentication**: Enhanced login and signup experience with improved UI/UX

---

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **React Query** - Data fetching
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Hook Form** - Form management
- **jsPDF** - PDF generation
- **Axios** - HTTP client

### Backend
- **NestJS 10** - Node.js framework
- **TypeScript** - Type safety
- **TypeORM** - ORM
- **MySQL** - Database
- **JWT** - Authentication
- **Nodemailer** - Email service
- **PayMongo SDK** - Payment processing
- **Cron Jobs** - Scheduled tasks

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy
- **ngrok** - Webhook tunneling (development)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** and **Docker Compose** (for containerized deployment)
- **MySQL** 8.0+ (if running without Docker)
- **Git**

### Required Accounts
- **PayMongo Account** - For payment processing
- **Email Service** (Gmail/SMTP) - For email notifications
- **ngrok Account** - For webhook tunneling (development)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Ivanlouis21/BACKUPREPO-CAPSTONE-NOV24.git
cd CAPSTONE-2025-BUDZ-RESERVE-
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

Or use the convenience script:

```bash
npm run install:all
```

---

## ⚙️ Configuration

### 1. Environment Variables

#### Backend Configuration (`backend/.env`)

Create `backend/.env` based on `backend/env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=budz_reserve

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# PayMongo
PAYMONGO_SECRET_KEY=your_paymongo_secret_key
PAYMONGO_PUBLIC_KEY=your_paymongo_public_key

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=noreply@budzreserve.com

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration (`frontend/.env`)

Create `frontend/.env` based on `frontend/env.example`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start MySQL container
docker-compose up -d mysql

# Wait for MySQL to be ready, then run migrations
cd backend
npm run migration:run
```

#### Option B: Manual MySQL Setup

1. Create a MySQL database:
```sql
CREATE DATABASE budz_reserve;
```

2. Import the database schema:
```bash
mysql -u root -p budz_reserve < database_export.sql
```

Or use the initialization script:
```bash
mysql -u root -p < init-database.sql
```

---

## 🏃 Running the Project

### Development Mode (Without Docker)

#### Start Backend
```bash
cd backend
npm run start:dev
```
Backend will run on `http://localhost:3001`

#### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

#### Run Both Simultaneously
```bash
# From root directory
npm run dev
```

### Production Mode

#### Build
```bash
npm run build
```

#### Start
```bash
npm start
```

---

## 🐳 Docker Setup

### Development Mode

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

**Service URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- MySQL: localhost:3306
- phpMyAdmin: http://localhost:8080

### Production Mode

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

**Service URLs:**
- Application: http://localhost:80
- Backend API: http://localhost:3001/api

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

For detailed Docker setup instructions, see [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md)

---

## 🚨 IMPORTANT: ngrok Setup for Payment Integration

**⚠️ CRITICAL: Payment webhooks will NOT work without ngrok setup!**

### Step 1: Install ngrok

Download from [ngrok.com](https://ngrok.com/download) or install via package manager:

```bash
# Windows (via Chocolatey)
choco install ngrok

# macOS (via Homebrew)
brew install ngrok

# Linux
# Download from ngrok.com
```

### Step 2: Create ngrok Account

1. Sign up at [ngrok.com](https://dashboard.ngrok.com/signup)
2. Get your authtoken from the dashboard

### Step 3: Configure ngrok

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Start ngrok Tunnel

```bash
# Start tunnel pointing to your backend
ngrok http 3001
```

### Step 5: Configure PayMongo Webhook

1. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
2. Go to PayMongo Dashboard → Webhooks
3. Add webhook URL: `https://abc123.ngrok.io/api/payments/webhook`
4. Select events: `payment.paid`, `payment.failed`

### Step 6: Update Backend Configuration

Update `backend/.env`:
```env
WEBHOOK_URL=https://abc123.ngrok.io/api/payments/webhook
```

**⚠️ Note:** The ngrok URL changes every time you restart ngrok (free tier). Update PayMongo webhook URL accordingly.

For detailed instructions, see:
- [NGROK_WEBHOOK_SETUP.md](./NGROK_WEBHOOK_SETUP.md)
- [NGROK_WEBHOOK_QUICK_GUIDE.md](./NGROK_WEBHOOK_QUICK_GUIDE.md)
- [PAYMONGO_WEBHOOK_CONFIGURATION.md](./PAYMONGO_WEBHOOK_CONFIGURATION.md)

---

## 📁 Project Structure

```
CAPSTONE-2025-BUDZ-RESERVE-
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── users/      # User management
│   │   │   ├── courts/    # Court management
│   │   │   ├── reservations/ # Reservation system
│   │   │   ├── payments/   # Payment processing
│   │   │   ├── equipment/  # Equipment management
│   │   │   └── queueing/   # Queue management
│   │   ├── database/        # Database config & migrations
│   │   └── templates/      # Email templates
│   ├── uploads/           # File uploads
│   └── dist/              # Compiled output
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities & API services
│   │   ├── hooks/         # Custom hooks
│   │   └── store/         # State management
│   └── public/           # Static assets
├── docker/               # Docker configurations
├── uploads/             # Shared uploads directory
├── docker-compose.yml    # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
└── README.md            # This file
```

---

## 🎯 Key Features

### 📅 Booking System
- Real-time court availability checking
- Time slot selection with validation
- Multiple court booking in single transaction
- Equipment rental integration
- Payment processing with PayMongo

### 🏸 Equipment Rental
- Dynamic stock management
- Quantity and duration selection
- Automated return reminder emails
- Stock restoration after rental period
- Valid ID requirement for safety

### 📧 Email Notifications & Reminders
- **Payment Receipts**: Automated email receipts after successful payments
- **Reservation Reminders**: Email notifications sent 24 hours before reservation start time
- **Reservation Ended**: Email notifications when reservations end
- **Rental Reminders**: Automated reminders for equipment return deadlines
- **Customizable Templates**: Handlebars-based email templates for all notifications

### 📊 Sales Reporting
- Period-based filtering (Daily, Weekly, Monthly, Quarterly, Yearly)
- Manual date range filtering
- Search functionality
- PDF export with summary
- Individual court reservation counting (not transactions)

### 👥 Queue Management
- Player queueing system
- Match creation and management
- Queue history tracking
- Access control (only users with active reservations)
- Real-time status updates
- Automated queue processing with scheduled tasks

### 🎨 UI/UX Improvements
- **Enhanced Login Page**: Modern design with improved form validation and user feedback
- **Enhanced Signup Page**: Improved form layout with better error handling
- **Payment Method Selection**: Visual payment method selection with icons
- **Responsive Design**: Mobile-friendly interface across all pages
- **Better Error Handling**: Clear error messages and validation feedback

### 🎨 Admin Dashboard
- Daily metrics (Court Reservations, Sales, Racket Rentals)
- Monthly reservation trends
- Quick access links
- User and court statistics

---

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Reservation Endpoints
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/my-reservations` - Get user's reservations
- `GET /api/reservations/availability` - Check court availability

### Payment Endpoints
- `POST /api/payments/create-payment` - Create payment intent
- `POST /api/payments/webhook` - PayMongo webhook handler
- `GET /api/payments/sales-report` - Get sales report

### Equipment Endpoints
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/availability` - Check equipment availability

For detailed API documentation, refer to the Swagger documentation at `/api/docs` when the backend is running.

---

## 🔧 Troubleshooting

### Payment Webhooks Not Working
- ✅ Ensure ngrok is running and tunnel is active
- ✅ Verify PayMongo webhook URL is correct
- ✅ Check backend logs for webhook errors
- ✅ Ensure `WEBHOOK_URL` in `.env` matches ngrok URL

### Database Connection Issues
- ✅ Verify MySQL is running
- ✅ Check database credentials in `.env`
- ✅ Ensure database exists
- ✅ Run migrations: `npm run migration:run`

### Email Not Sending
- ✅ Verify email credentials in `.env`
- ✅ For Gmail, use App Password (not regular password)
- ✅ Check SMTP settings
- ✅ Review backend logs for email errors

### Frontend Not Connecting to Backend
- ✅ Verify `VITE_API_URL` in `frontend/.env`
- ✅ Ensure backend is running
- ✅ Check CORS settings in backend
- ✅ Verify API endpoints are correct

### Docker Issues
- ✅ Ensure Docker and Docker Compose are installed
- ✅ Check container logs: `docker-compose logs`
- ✅ Rebuild containers: `docker-compose up -d --build`
- ✅ Verify ports are not in use

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Update documentation for new features
- Test thoroughly before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team
- Refer to documentation files in the repository

---

## 📝 Additional Documentation

- [Docker Quick Start Guide](./DOCKER_QUICK_START.md)
- [Docker Setup Guide](./DOCKER_SETUP.md)
- [ngrok Webhook Setup](./NGROK_WEBHOOK_SETUP.md)
- [ngrok Quick Guide](./NGROK_WEBHOOK_QUICK_GUIDE.md)
- [PayMongo Configuration](./PAYMONGO_WEBHOOK_CONFIGURATION.md)
- [Team Setup Guide](./TEAM_SETUP_GUIDE.md)

---

## 🎉 Acknowledgments

- PayMongo for payment processing
- NestJS and React communities
- All contributors and team members

---

**Made with ❤️ by the Budz Reserve Team**
