# PayMongo Integration Setup Guide

## ✅ What's Been Completed

The PayMongo payment integration has been successfully implemented in your Badminton Court Reservation System. Here's what's been set up:

### Backend Implementation
1. **PayMongo Service** (`backend/src/modules/payments/paymongo.service.ts`)
   - Handles payment intent creation
   - Manages payment sources (GCash, Maya, Grab Pay, etc.)
   - Creates checkout sessions with redirect URLs
   - Integrates with PayMongo API v1

2. **Payment Controller** (`backend/src/modules/payments/payment.controller.ts`)
   - `POST /api/payment/create-checkout` - Creates PayMongo checkout session
   - `GET /api/payment/status/:id` - Checks payment status

3. **Updated Dependencies**
   - Added PayMongo package to `package.json`
   - Updated environment variables for PayMongo keys

### Frontend Implementation
1. **Payment Service** (`frontend/src/lib/paymentService.ts`)
   - Handles API calls to backend payment endpoints
   - Manages checkout session creation

2. **Updated BookingDetailsModal**
   - Now calls PayMongo API when "Proceed to Payment" is clicked
   - Redirects to PayMongo checkout URL

3. **Payment Result Pages**
   - `PaymentSuccessPage.tsx` - Shows success message and booking details
   - `PaymentFailedPage.tsx` - Handles payment failures with retry options

## 🔧 How to Complete the Setup

### Step 1: Get PayMongo API Keys

1. **Sign up for PayMongo**
   - Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
   - Create an account or log in

2. **Get your API keys**
   - Navigate to "Developers" → "API Keys"
   - Copy your **Secret Key** (starts with `sk_test_` for test mode)
   - Copy your **Public Key** (starts with `pk_test_` for test mode)

### Step 2: Configure Environment Variables

You need to set up environment variables for the backend. Since `.env` files are blocked, you can:

**Option A: Use Docker Compose Environment Variables**

Edit `docker-compose.dev.yml` and add these environment variables to the backend service:

```yaml
services:
  backend:
    environment:
      - PAYMONGO_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
      - PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
      - FRONTEND_URL=http://localhost:3000
```

**Option B: Create Environment File Manually**

Create a file named `.env` in the `backend` directory with these contents:

```env
# Database Configuration
DB_HOST=budz-reserve-mysql
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
PAYMONGO_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
PAYMONGO_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
PAYMONGO_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### Step 3: Restart the Backend

After setting up the environment variables, restart the backend container:

```powershell
docker-compose -f docker-compose.dev.yml restart backend
```

## 🧪 Testing the Integration

1. **Open the application**
   - Go to http://localhost:3000

2. **Make a test booking**
   - Log in to your account
   - Navigate to the booking page
   - Select a court and time slot
   - Click "Proceed to Payment"

3. **Complete the payment**
   - You'll be redirected to PayMongo's secure checkout page
   - Use PayMongo test cards for testing:
     - **Successful Payment**: `4343434343434345`
     - **Failed Payment**: `4571736000000075`
     - CVV: Any 3 digits
     - Expiry: Any future date

4. **Verify the result**
   - After payment, you'll be redirected to success/failure page
   - Check the booking status in your dashboard

## 📋 Payment Flow

1. User fills out booking details
2. User clicks "Proceed to Payment"
3. Frontend calls backend `/api/payment/create-checkout`
4. Backend creates PayMongo payment intent and source
5. Backend returns checkout URL
6. User is redirected to PayMongo checkout page
7. User completes payment
8. PayMongo redirects to success/failure page
9. Frontend displays result

## 🔒 Security Notes

- **Never commit API keys** to version control
- Use **test keys** for development
- Use **live keys** only in production
- Enable **webhook signatures** for production
- Implement **proper error handling**

## 🚀 Going to Production

When you're ready to go live:

1. **Get live API keys** from PayMongo dashboard
2. **Update environment variables** with live keys
3. **Enable webhooks** for payment status updates
4. **Test thoroughly** with real payments
5. **Monitor transactions** in PayMongo dashboard

## 📚 Additional Resources

- [PayMongo API Documentation](https://developers.paymongo.com/docs)
- [PayMongo Test Cards](https://developers.paymongo.com/docs/testing)
- [PayMongo Webhooks](https://developers.paymongo.com/docs/webhooks)

## ✅ Verification Checklist

- [ ] PayMongo account created
- [ ] API keys obtained
- [ ] Environment variables configured
- [ ] Backend restarted
- [ ] Test payment completed successfully
- [ ] Success page displays correctly
- [ ] Failure page displays correctly

## 🐛 Troubleshooting

### "PayMongo API error: You did not provide an API key"
- Check that environment variables are set correctly
- Restart the backend container
- Verify the secret key starts with `sk_test_` or `sk_live_`

### "Cannot POST /api/payment/create-checkout"
- Ensure backend is running with NestJS (not simple-server.js)
- Check backend logs: `docker logs budz-reserve-backend`
- Verify the endpoint is registered in logs

### Payment redirect not working
- Check `FRONTEND_URL` environment variable
- Verify success/failure routes are configured in `App.tsx`
- Check browser console for errors

## 🎉 Congratulations!

Your PayMongo integration is now complete! You can now accept payments for badminton court bookings through GCash, Maya, Grab Pay, and other payment methods supported by PayMongo.

