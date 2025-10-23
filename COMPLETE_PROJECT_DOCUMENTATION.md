# 🏸 Budz Reserve - Complete Project Documentation

A comprehensive badminton court booking system with full-stack React/NestJS implementation, Docker containerization, and Paymongo payment integration.

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

1. [Project Overview](#-project-overview)
2. [🚨 IMPORTANT: ngrok Setup for Payment Integration](#-important-ngrok-setup-for-payment-integration)
3. [Quick Start Guide](#-quick-start-guide)
4. [Technical Architecture](#-technical-architecture)
5. [Features & Capabilities](#-features--capabilities)
6. [Payment Integration](#-payment-integration)
7. [Database Setup](#-database-setup)
8. [Deployment Guide](#-deployment-guide)
9. [Admin Management](#-admin-management)
10. [Equipment & Racket Setup](#-equipment--racket-setup)
11. [Troubleshooting](#-troubleshooting)
12. [API Documentation](#-api-documentation)
13. [Security & Best Practices](#-security--best-practices)

---

## 🚨 IMPORTANT: ngrok Setup for Payment Integration

> **⚠️ CRITICAL NOTICE**: The payment system **WILL NOT WORK** without ngrok! All teammates must complete this setup before testing payments.

### Why ngrok is Required
- **Paymongo webhooks** need a public URL to send payment notifications
- **Local development** (localhost:3001) is not accessible from Paymongo servers
- **ngrok creates a secure tunnel** from your local machine to the internet
- **Without ngrok**: Payments will process but reservations won't be saved automatically

### 🚨 What Happens Without ngrok
- ❌ **Payments process** but webhooks fail
- ❌ **No automatic reservation creation**
- ❌ **No email receipts sent**
- ❌ **Manual database updates required**
- ❌ **Incomplete payment flow**

---

## 📥 Step 1: Install ngrok

### For Windows Users
1. **Download ngrok** from [ngrok.com/download](https://ngrok.com/download)
2. **Extract the zip file** to a folder (e.g., `C:\ngrok\`)
3. **Add ngrok to PATH**:
   - Open System Properties → Environment Variables
   - Add `C:\ngrok\` to your PATH variable
   - Restart your command prompt

### For Mac Users
```bash
# Using Homebrew (recommended)
brew install ngrok/ngrok/ngrok

# Or download from ngrok.com
```

### For Linux Users
```bash
# Download and install
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

### Verify Installation
```bash
# Test that ngrok is installed
ngrok version
# Should show: ngrok version 3.x.x
```

---

## 🔑 Step 2: Create ngrok Account & Get Auth Token

### Create Account
1. **Go to** [ngrok.com](https://ngrok.com)
2. **Sign up** for a free account
3. **Verify your email**

### Get Auth Token
1. **Login to ngrok dashboard**
2. **Go to** "Your Authtoken" section
3. **Copy your authtoken** (starts with `2_...`)

### Configure ngrok
```bash
# Add your authtoken (replace with your actual token)
ngrok config add-authtoken 2_your_actual_token_here
```

---

## 🚀 Step 3: Start ngrok Tunnel

### Start the Tunnel
```bash
# In a new terminal/command prompt, run:
ngrok http 3001
```

### Expected Output
```
ngrok

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.24.0
Region                        Asia Pacific (ap)
Latency                       57ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### ⚠️ IMPORTANT: Keep ngrok Running
- **DO NOT close** the ngrok terminal
- **DO NOT stop** the ngrok process
- **Keep it running** while testing payments

---

## 🔧 Step 4: Update Paymongo Webhook URL

### Get Your ngrok URL
From the ngrok output, copy the **Forwarding URL**:
```
https://abc123def456.ngrok-free.app
```

### Update Paymongo Dashboard
1. **Go to** [Paymongo Dashboard](https://dashboard.paymongo.com/)
2. **Login** to your account
3. **Navigate to** "Developers" → "Webhooks"
4. **Edit existing webhook** or **Create new webhook**
5. **Update the URL** to: `https://your-ngrok-url.ngrok-free.app/api/webhook/paymongo`
6. **Select events**: `payment.paid`, `payment.failed`
7. **Save** the webhook

### Example Webhook URL
```
https://abc123def456.ngrok-free.app/api/webhook/paymongo
```

---

## 🧪 Step 5: Test the Setup

### Test Webhook Connection
```bash
# Test if your webhook is accessible
curl https://your-ngrok-url.ngrok-free.app/api/webhook/paymongo

# Should return: {"message": "Paymongo webhook endpoint"}
```

### Test Payment Flow
1. **Start your application**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Make a test booking**:
   - Go to http://localhost:3000
   - Login and make a booking
   - Click "Proceed to Payment"

3. **Complete payment**:
   - Use test card: `4242424242424242`
   - Complete the payment process

4. **Verify webhook**:
   - Check ngrok terminal for webhook requests
   - Check database for new reservation
   - Check email for receipt

---

## 🔄 Step 6: Daily Workflow

### Every Time You Start Development
1. **Start ngrok first**:
   ```bash
   ngrok http 3001
   ```

2. **Copy the new ngrok URL** (it changes each time)

3. **Update Paymongo webhook** with new URL

4. **Start your application**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

### ⚠️ Important Notes
- **ngrok URL changes** every time you restart ngrok
- **Update Paymongo webhook** each time
- **Keep ngrok running** during development
- **Free ngrok accounts** have session limits

---

## 🆘 Troubleshooting ngrok

### Common Issues

#### "ngrok: command not found"
```bash
# Windows: Add ngrok to PATH
# Mac/Linux: Install properly
brew install ngrok/ngrok/ngrok
```

#### "ngrok session expired"
```bash
# Restart ngrok
ngrok http 3001
# Update Paymongo webhook with new URL
```

#### "Webhook not receiving requests"
- Check ngrok is running
- Verify webhook URL in Paymongo
- Check backend is running on port 3001
- Test webhook URL manually

#### "ngrok tunnel not accessible"
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Restart backend
docker-compose restart backend
```

### Debug Commands
```bash
# Check ngrok status
ngrok status

# View ngrok web interface
# Go to http://127.0.0.1:4040

# Test webhook endpoint
curl https://your-ngrok-url.ngrok-free.app/api/webhook/paymongo
```

---

## 📋 Team Checklist

### Before Starting Development
- [ ] ngrok installed and configured
- [ ] ngrok authtoken added
- [ ] Paymongo webhook URL updated
- [ ] Backend running on port 3001
- [ ] ngrok tunnel active

### Daily Setup
- [ ] Start ngrok: `ngrok http 3001`
- [ ] Copy new ngrok URL
- [ ] Update Paymongo webhook URL
- [ ] Start application: `docker-compose -f docker-compose.dev.yml up -d`
- [ ] Test payment flow

### If Payment Issues
- [ ] Check ngrok is running
- [ ] Verify webhook URL in Paymongo
- [ ] Check backend logs: `docker-compose logs backend`
- [ ] Test webhook endpoint manually
- [ ] Restart ngrok if needed

---

## 🎯 Summary

**ngrok is ESSENTIAL for payment integration!** Without it:
- ❌ Payments won't work properly
- ❌ Reservations won't be created automatically
- ❌ Email receipts won't be sent
- ❌ Webhook processing will fail

**Every teammate must:**
1. ✅ Install ngrok
2. ✅ Get authtoken and configure
3. ✅ Start ngrok tunnel
4. ✅ Update Paymongo webhook URL
5. ✅ Keep ngrok running during development

---

## 🎯 Project Overview

**Budz Reserve** is a modern, full-stack web application for booking badminton courts, built with React, NestJS, and MySQL. The system provides a complete solution for court reservations, equipment rental, user management, and payment processing.

### 🆕 Latest Updates (v2.0)

#### 🎯 New Admin Management Pages
- **Admin Manage Courts**: Enhanced court management with dynamic pricing, status updates, and pagination
- **Admin Manage Rackets**: Comprehensive equipment management with image upload and modal interfaces
- **Admin View Suggestions**: Message management system for user feedback and suggestions
- **Enhanced Admin Dashboard**: Improved welcome section with modern UI/UX design

#### 🔧 Enhanced Features
- **Sticky Sidebar Navigation**: Always-accessible navigation across all admin pages
- **Auto-save Login**: Remember me functionality with localStorage integration
- **Image Management**: Upload, preview, and manage equipment images with modal interfaces
- **Responsive Design**: Enhanced mobile optimization across all admin interfaces
- **Professional UI/UX**: Modern design with gradients, shadows, and smooth animations

#### 📱 Improved User Experience
- **Modal Interfaces**: Professional popup modals for equipment editing and image previews
- **Enhanced Pagination**: Dynamic pagination with improved navigation controls
- **Visual Feedback**: Better hover effects, transitions, and micro-interactions
- **Typography**: Gradient text effects and improved readability

---

## 🚀 Quick Start Guide

### Prerequisites
- **Docker Desktop** - Download from [docker.com](https://docker.com)
- **Git** - For cloning the repository
- **ngrok** - **REQUIRED for payment integration** (see ngrok setup above)

### ⚠️ IMPORTANT: Complete ngrok Setup First
**Before starting the application, you MUST complete the ngrok setup above!** The payment system will not work without it.
- **XAMPP** (Optional) - For phpMyAdmin access

### Step 1: Complete ngrok Setup
**MUST DO FIRST**: Follow the complete ngrok setup guide above before proceeding!

### Step 2: Clone and Setup
```bash
# Clone the repository
git clone https://github.com/B33Keeper/CAPSTONE-2025-BUDZ-RESERVE-.git
cd CAPSTONE-2025-BUDZ-RESERVE-
git checkout react-version

# Copy environment template
cp env.template .env
```

### Step 3: Start XAMPP (Optional)
- Open XAMPP Control Panel
- Start **Apache** service only
- **DO NOT start MySQL** - We'll use Docker's MySQL
- Keep XAMPP running for phpMyAdmin access

### Step 4: Start ngrok Tunnel
```bash
# In a new terminal, start ngrok
ngrok http 3001

# Copy the ngrok URL (e.g., https://abc123.ngrok-free.app)
# Update Paymongo webhook URL with this new URL
```

### Step 5: Start the Application
```bash
# Start all services (Frontend + Backend + Database + Nginx)
docker-compose -f docker-compose.dev.yml up -d

# Check if everything is running
docker-compose -f docker-compose.dev.yml ps

# View logs if needed
docker-compose -f docker-compose.dev.yml logs -f
```

### Step 6: Access the Application
- **🌐 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:3001/api
- **📚 API Documentation**: http://localhost:3001/api/docs
- **💾 Database (phpMyAdmin)**: http://localhost/phpmyadmin
  - Server: 127.0.0.1:3307
  - Username: budz_user
  - Password: budz_password
  - Database: budz_reserve

### Step 7: Test Payment Integration
1. **Make a test booking**:
   - Go to http://localhost:3000
   - Login and make a booking
   - Click "Proceed to Payment"

2. **Complete payment**:
   - Use test card: `4242424242424242`
   - Complete the payment process

3. **Verify webhook**:
   - Check ngrok terminal for webhook requests
   - Check database for new reservation
   - Check email for receipt

### Step 8: Stop Everything
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Stop Nginx if needed (for phpMyAdmin access)
docker stop budz-reserve-nginx
```

---

## 🛠️ Technical Architecture

### Frontend Stack
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

### Backend Stack
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

---

## 🚀 Features & Capabilities

### 🔐 Authentication & Security
- **User Authentication**: Secure login/registration with JWT tokens and database persistence
- **Auto-save Login**: Remember me functionality with localStorage integration for seamless user experience
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
- **Advanced Equipment Management**: Comprehensive racket and equipment inventory with image management
- **Equipment Rental**: Badminton equipment rental with inventory management
- **Equipment Catalog**: Rackets, shoes, socks, and other badminton gear with enhanced visual display
- **Image Management**: Upload, preview, and manage equipment images with modal interfaces
- **Inventory Tracking**: Real-time equipment availability and status with enhanced UI
- **Equipment Pricing**: Dynamic pricing for different equipment types
- **Modal Interfaces**: Edit and add equipment with popup modals for better user experience

### 👤 User Management
- **Profile Management**: User profile with photo upload, change password, and settings
- **Avatar Upload**: Profile picture upload with image optimization
- **User Dashboard**: Personal dashboard with booking history and statistics
- **Account Settings**: Comprehensive user account management

### 👨‍💼 Admin Dashboard
- **Enhanced Admin Panel**: Complete administrative dashboard with modern UI/UX design
- **Admin Manage Courts**: Comprehensive court management with pricing, status updates, and pagination
- **Admin Manage Rackets**: Equipment management with image upload, inventory tracking, and modal interfaces
- **Admin View Suggestions**: Message management system with user feedback handling
- **Sticky Sidebar Navigation**: Always-accessible navigation with smooth scrolling
- **User Management**: View and manage all registered users with enhanced interface
- **Analytics**: Real-time statistics and data visualization with interactive charts
- **Charts & Reports**: Monthly overview charts and reservation status pie charts
- **User Statistics**: Total user count, daily reservations, and sales tracking
- **Responsive Design**: Mobile-friendly admin interface with collapsible sidebar
- **Auto-save Login**: Remember me functionality with localStorage integration

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
- **Enhanced Responsive Design**: Mobile-first design with improved responsiveness across all admin pages
- **Modern UI/UX**: Enhanced visual design with gradients, shadows, and smooth animations
- **Interactive Components**: Hover effects, transitions, and micro-interactions with enhanced visual feedback
- **Sticky Navigation**: Always-accessible sidebar navigation with smooth scrolling
- **Modal Interfaces**: Professional popup modals for equipment management and image previews
- **Custom Scrollbars**: Styled scrollbars for better user experience
- **Loading States**: Comprehensive loading indicators and skeleton screens
- **Enhanced Typography**: Gradient text effects and improved readability

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

---

## 💳 Payment Integration

### PayMongo Integration Overview
The system includes a complete PayMongo payment gateway integration with the following features:
- Payment Intent creation and management
- Multiple payment methods (Card, GCash, PayMaya, GrabPay)
- Payment method creation and attachment
- Email receipts and confirmations
- Webhook handling for payment status updates
- Frontend payment forms

### API Keys Configuration
The integration uses the following test API keys:
- **Public Key**: `pk_test_wqL9TDyzi8VqZ8wz96qZQNYm`
- **Secret Key**: `sk_test_gR6gPcDcqGdwXnSDjvyMipRH`
- **Webhook Secret**: `whsk_MVahvXgqKjLYjdWyTe5Zbznv`

### Payment Flow
1. User fills out booking details
2. User clicks "Proceed to Payment"
3. Frontend calls backend `/api/payment/create-checkout`
4. Backend creates PayMongo checkout session
5. User is redirected to PayMongo checkout page
6. User completes payment
7. PayMongo redirects to success/failure page
8. Webhook processes payment and creates reservation
9. Email receipt is sent to customer

### Supported Payment Methods
1. **Credit/Debit Card** - Visa, Mastercard, American Express
2. **GCash** - Mobile wallet payment
3. **PayMaya** - Mobile wallet payment
4. **GrabPay** - Mobile wallet payment
5. **Online Banking** - Bank transfer options

### Testing
Use the following test card numbers for testing:
- **Successful Payment**: `4242424242424242`
- **Declined Payment**: `4000000000000002`
- **Requires Authentication**: `4000002500003155`

---

## 🗄️ Database Setup

### Automatic Database Initialization
The database will be automatically initialized with:
- ✅ Complete database schema
- ✅ All existing data from production (12 courts, 6 users, 25 reservations)
- ✅ Proper user accounts and permissions
- ✅ Sample courts and equipment data
- ✅ Payment records and reservation history

### Database Access
- **URL**: http://localhost/phpmyadmin
- **Server**: 127.0.0.1:3307
- **Username**: budz_user
- **Password**: budz_password
- **Database**: budz_reserve

### Database Management
```bash
# Create backup
docker exec budz-reserve-mysql mysqldump -u root -p budz_reserve > backup.sql

# Restore backup
docker exec -i budz-reserve-mysql mysql -u root -p budz_reserve < backup.sql

# Run migrations
docker exec budz-reserve-backend npm run migration:run

# Generate new migration
docker exec budz-reserve-backend npm run migration:generate -- -n MigrationName
```

---

## 🚀 Deployment Guide

### Development Environment
```bash
# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Environment
```bash
# Start production services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Environment Variables
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

### Nginx Configuration
Create `/etc/nginx/sites-available/budz-reserve`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /path/to/your/app/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 👨‍💼 Admin Management

### Dashboard Overview
- **Real-time Statistics**: Live user count, daily reservations, and sales tracking
- **Interactive Charts**: Monthly overview bar charts and reservation status pie charts
- **User Management**: View and manage all registered users
- **Responsive Design**: Mobile-friendly admin interface with collapsible sidebar

### Admin Capabilities
- **Enhanced Court Management**: Add, edit, and manage court availability with dynamic pricing and status updates
- **Advanced Equipment Management**: Comprehensive racket and equipment inventory with image management
- **Message Management**: View and manage user suggestions and feedback messages
- **User Management**: View total users, active users, and user statistics with enhanced interface
- **Reservation Oversight**: View and manage all court reservations with improved pagination
- **Payment Monitoring**: Track payment status and transaction history
- **System Analytics**: Monitor system performance and usage statistics
- **Image Management**: Upload, preview, and manage equipment images with modal interfaces
- **Responsive Design**: Mobile-optimized admin interface with sticky navigation

### Security Features
- **Role-based Access**: Admin-only access to sensitive operations
- **JWT Authentication**: Secure admin authentication
- **API Protection**: Protected endpoints with proper authorization
- **Audit Logging**: Track admin actions and system changes

---

## 🎾 Equipment & Racket Setup

### Adding New Racket Images
To add the 5 different badminton racket images:

1. **Save each image** with these exact filenames in `frontend/public/assets/img/equipments/`:
   - `racket-black-red.png` - Black/red badminton racket
   - `racket-silver-white.png` - Silver/white badminton racket
   - `racket-dark-frame.png` - Dark frame with white grip
   - `racket-white-silver.png` - White head with silver frame
   - `racket-yellow-green.png` - Yellow/green badminton racket

2. **Update the database** by running the SQL script:
   ```bash
   mysql -u your_username -p budz_reserve < add_racket_equipment.sql
   ```

3. **Restart the application** to see the changes:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Expected Results
After completing these steps, the "Rent a Racket" page will display:
1. **Standard Badminton Racket** (original) - ₱150/hour
2. **Professional Badminton Racket - Black/Red** - ₱180/hour (15 available)
3. **Premium Badminton Racket - Silver/White** - ₱200/hour (12 available)
4. **Elite Badminton Racket - Dark Frame** - ₱160/hour (18 available)
5. **Championship Badminton Racket - White/Silver** - ₱220/hour (10 available)
6. **Tournament Badminton Racket - Yellow/Green** - ₱190/hour (14 available)

---

## 🆘 Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3306

# Stop conflicting services or change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check if MySQL is running
docker-compose logs mysql

# Restart database
docker-compose restart mysql

# Check database initialization
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

#### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

#### Backend API Not Responding
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check if backend is healthy
curl http://localhost:3001/health
```

### Debug Commands
```bash
# Check container status
docker-compose ps

# View logs for specific service
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Full reset
docker-compose down -v
docker-compose up -d --build

# Check Docker system resources
docker system df
docker system prune
```

### Payment Integration Issues

#### "PayMongo API error: You did not provide an API key"
- Check that environment variables are set correctly
- Restart the backend container
- Verify the secret key starts with `sk_test_` or `sk_live_`

#### "Cannot POST /api/payment/create-checkout"
- Ensure backend is running with NestJS (not simple-server.js)
- Check backend logs: `docker logs budz-reserve-backend`
- Verify the endpoint is registered in logs

#### Payment redirect not working
- Check `FRONTEND_URL` environment variable
- Verify success/failure routes are configured in `App.tsx`
- Check browser console for errors

---

## 📚 API Documentation

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

---

## 🔒 Security & Best Practices

### Security Considerations
1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable SSL/TLS**
4. **Regular security updates**
5. **Database access restrictions**
6. **File upload validation**
7. **Rate limiting**
8. **CORS configuration**

### Production Setup
1. Replace test API keys with live keys
2. Update webhook URLs to production domain
3. Configure email SMTP settings
4. Implement proper webhook signature verification
5. Set up monitoring and logging

### Code Standards
- Use TypeScript for all new code
- Follow existing component structure
- Add proper error handling
- Include JSDoc comments for functions
- Test changes locally before pushing

### Database Changes
- Never modify the database directly
- Use TypeORM migrations for schema changes
- Test migrations locally first
- Coordinate with team for major changes

---

## 📞 Support

If you have any questions or need help:

1. **Check the logs**: `docker-compose logs -f`
2. **Verify environment variables**
3. **Check port availability**
4. **Review Docker and Docker Compose versions**
5. **Open an issue on GitHub**
6. **Contact us at support@budzreserve.com**

---

## 🎉 Conclusion

**Budz Reserve** is a comprehensive, production-ready badminton court booking system with modern technology stack, secure payment integration, and user-friendly interface. The system is designed to scale and can handle real-world usage with proper deployment and monitoring.

**Happy Coding! 🏸✨**

---

*This documentation combines all project guides into a single comprehensive reference. For specific implementation details, refer to the individual markdown files in the project repository.*
