# PayMongo Webhook Configuration Guide

This guide explains how to configure PayMongo webhooks for the Budz Reserve application.

## Overview

The webhook system receives payment events from PayMongo and automatically:
- Creates reservation records in the database
- Creates payment records linked to reservations
- Creates equipment rental records (if applicable)
- Sends email receipts to customers

## Webhook Endpoint

**Endpoint URL:** `POST /api/webhook/paymongo`

**Status Check:** `GET /api/webhook/paymongo` - Returns webhook configuration and status

## Configuration Steps

### 1. Environment Variables

Configure these in your `.env` file (or environment):

```env
# PayMongo API Keys
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here

# Webhook Secret (from PayMongo Dashboard)
PAYMONGO_WEBHOOK_SECRET=whsk_your_webhook_secret_here

# Application URL (for webhook endpoint)
FRONTEND_URL=http://localhost:3000
PORT=3001
API_PREFIX=api
```

### 2. Get Your PayMongo Keys

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Settings** > **API Keys**
3. Copy your **Secret Key** and **Public Key**
   - Test mode: Keys start with `sk_test_` and `pk_test_`
   - Live mode: Keys start with `sk_live_` and `pk_live_`

### 3. Create Webhook in PayMongo Dashboard

1. Go to **Webhooks** in PayMongo Dashboard
2. Click **Create Webhook**
3. Enter your webhook URL:
   - **Development:** `http://your-domain:3001/api/webhook/paymongo`
   - **Production:** `https://your-domain.com/api/webhook/paymongo`
4. Select events to listen for:
   - ✅ `payment.paid`
   - ✅ `checkout_session.payment.paid`
   - ✅ `payment.failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.failed`
5. Copy the **Webhook Secret** (starts with `whsk_`)
6. Add it to your `.env` file as `PAYMONGO_WEBHOOK_SECRET`

### 4. For Local Development (ngrok)

If testing locally, use ngrok to expose your local server:

```bash
# Install ngrok: https://ngrok.com/
ngrok http 3001

# Use the ngrok URL in PayMongo webhook configuration
# Example: https://abc123.ngrok.io/api/webhook/paymongo
```

## Security

### Signature Verification

The webhook controller verifies PayMongo signatures to ensure requests are legitimate:

- **Development Mode:** Signature verification is optional (allows testing)
- **Production Mode:** Signature verification is **REQUIRED**

If `PAYMONGO_WEBHOOK_SECRET` is not configured:
- ⚠️ Development: Webhooks will work but without verification
- ❌ Production: Webhooks will be rejected

### Raw Body Parsing

The application is configured to preserve raw request body for signature verification:
- Configured in `backend/src/main.ts`
- Only applies to webhook endpoints
- Required for HMAC signature verification

## Webhook Events Handled

### 1. `payment.paid`
- Triggered when a payment is successfully completed
- Creates reservation and payment records
- Sends email receipt

### 2. `checkout_session.payment.paid`
- Triggered when checkout session payment is completed
- Extracts booking data from checkout session metadata
- Creates reservation and payment records
- Handles equipment rentals

### 3. `payment.failed`
- Triggered when payment fails
- Logs failure (can be extended to update reservation status)

### 4. `payment_intent.succeeded` / `payment_intent.failed`
- Triggered for payment intent events
- Currently logged (can be extended)

## Testing

### Test Webhook Endpoint

Use the test endpoint to simulate webhook events:

```bash
POST /api/webhook/test-webhook
Content-Type: application/json

{
  "paymentId": "pay_test123",
  "amount": 500,
  "paymentMethod": "gcash",
  "customerName": "Test User",
  "customerEmail": "test@example.com",
  "customerPhone": "+639123456789",
  "bookingData": {
    "userId": 1,
    "selectedDate": "2025-01-15",
    "courtBookings": [
      {
        "court": "Court 1",
        "schedule": "8:00 AM - 9:00 AM",
        "subtotal": 500
      }
    ]
  }
}
```

### Check Webhook Status

```bash
GET /api/webhook/paymongo
```

Returns:
- Webhook endpoint URL
- Configuration status
- Signature verification status
- Setup instructions

## Troubleshooting

### Webhook Not Receiving Events

1. **Check PayMongo Dashboard:**
   - Go to Webhooks > Your Webhook > Events
   - Check if events are being sent
   - Check delivery status

2. **Check Server Logs:**
   - Look for "🔔 PayMongo Webhook Received" messages
   - Check for signature verification errors

3. **Verify Endpoint URL:**
   - Ensure URL is accessible from internet (use ngrok for local)
   - Check that endpoint matches exactly: `/api/webhook/paymongo`

4. **Check Environment Variables:**
   ```bash
   # Verify keys are loaded
   echo $PAYMONGO_SECRET_KEY
   echo $PAYMONGO_WEBHOOK_SECRET
   ```

### Signature Verification Failing

1. **Check Webhook Secret:**
   - Ensure `PAYMONGO_WEBHOOK_SECRET` matches the secret from PayMongo Dashboard
   - Secret should start with `whsk_test_` (test) or `whsk_live_` (live)

2. **Check Raw Body:**
   - Verify `rawBody` is being captured (check logs)
   - Ensure middleware is configured correctly in `main.ts`

3. **Development Mode:**
   - In development, invalid signatures are allowed
   - In production, invalid signatures are rejected

### Payment Not Creating Reservations

1. **Check Booking Data:**
   - Ensure `bookingData` is included in checkout session metadata
   - Check webhook logs for booking data parsing

2. **Check Database:**
   - Verify database connection
   - Check for constraint violations in logs

3. **Check User ID:**
   - Ensure `userId` in booking data exists in database
   - Verify court names match exactly

## Production Checklist

Before going live:

- [ ] Switch to **Live Mode** API keys (`sk_live_` and `pk_live_`)
- [ ] Configure `PAYMONGO_WEBHOOK_SECRET` with live webhook secret
- [ ] Set `NODE_ENV=production`
- [ ] Update webhook URL in PayMongo Dashboard to production URL
- [ ] Test webhook with a real payment
- [ ] Monitor logs for any errors
- [ ] Verify email receipts are being sent
- [ ] Ensure HTTPS is enabled for webhook endpoint

## API Reference

### Webhook Payload Structure

```typescript
interface PaymongoWebhookEvent {
  data: {
    id: string;
    type: string;
    attributes: {
      type: string; // Event type: 'payment.paid', 'checkout_session.payment.paid', etc.
      livemode: boolean;
      data: {
        id: string;
        type: string;
        attributes: any;
      };
      created_at: number;
    };
  };
}
```

### Response Format

All webhook endpoints return:

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify PayMongo Dashboard webhook event logs
3. Test with the test webhook endpoint
4. Check environment variable configuration

