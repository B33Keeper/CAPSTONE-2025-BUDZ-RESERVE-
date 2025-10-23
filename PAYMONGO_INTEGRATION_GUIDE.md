# Paymongo Integration Guide

This guide explains how to use the integrated Paymongo payment system in the Budz Reserve application.

## Overview

The Paymongo integration provides a complete payment solution with the following features:
- Payment Intent creation and management
- Multiple payment methods (Card, GCash, PayMaya, GrabPay)
- Payment method creation and attachment
- Email receipts and confirmations
- Webhook handling for payment status updates
- Frontend payment forms

## API Keys

The integration uses the following test API keys:
- **Public Key**: `pk_test_wqL9TDyzi8VqZ8wz96qZQNYm`
- **Secret Key**: `sk_test_gR6gPcDcqGdwXnSDjvyMipRH`

## Backend API Endpoints

### Payment Intent Management

#### Create Payment Intent
```http
POST /api/payment/create-intent
Content-Type: application/json

{
  "amount": 1000,
  "description": "Badminton Court Booking",
  "metadata": {
    "reservation_id": 123,
    "user_id": 456
  }
}
```

#### Get Payment Intent
```http
GET /api/payment/intent/{paymentIntentId}
```

### Payment Method Management

#### Create Payment Method
```http
POST /api/payment/create-method
Content-Type: application/json

{
  "type": "card",
  "details": {
    "card_number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2025,
    "cvc": "123"
  },
  "billing": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+639123456789",
    "address": {
      "line1": "123 Main Street",
      "line2": "Unit 1",
      "city": "Manila",
      "state": "Metro Manila",
      "postal_code": "1000",
      "country": "PH"
    }
  }
}
```

#### Attach Payment Method
```http
POST /api/payment/attach-method
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890",
  "paymentMethodId": "pm_1234567890",
  "returnUrl": "http://localhost:3000/payment/success"
}
```

### Complete Payment Processing

#### Process Payment (All-in-one)
```http
POST /api/payment/process
Content-Type: application/json

{
  "amount": 1000,
  "paymentMethodType": "card",
  "paymentDetails": {
    "card_number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2025,
    "cvc": "123"
  },
  "billingInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+639123456789",
    "address": {
      "line1": "123 Main Street",
      "city": "Manila",
      "state": "Metro Manila",
      "postal_code": "1000",
      "country": "PH"
    }
  },
  "description": "Badminton Court Booking",
  "metadata": {
    "reservation_id": 123
  },
  "reservationId": 123
}
```

### Webhook Handling

#### Paymongo Webhook
```http
POST /api/webhook/paymongo
Content-Type: application/json
Paymongo-Signature: {signature}

{
  "data": {
    "id": "evt_1234567890",
    "type": "event",
    "attributes": {
      "type": "payment.paid",
      "data": {
        "id": "pay_1234567890",
        "type": "payment",
        "attributes": {
          "amount": 1000,
          "currency": "PHP",
          "status": "paid"
        }
      }
    }
  }
}
```

## Frontend Usage

### Using the Payment Service

```typescript
import { PaymentService } from '../lib/paymentService';

// Create a payment intent
const paymentIntent = await PaymentService.createPaymentIntent(
  1000, // amount in PHP
  'Badminton Court Booking',
  { reservation_id: 123 }
);

// Process a complete payment
const paymentResult = await PaymentService.processPayment(
  1000, // amount
  'card', // payment method type
  {
    card_number: '4242424242424242',
    exp_month: 12,
    exp_year: 2025,
    cvc: '123'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+639123456789',
    address: {
      line1: '123 Main Street',
      city: 'Manila',
      state: 'Metro Manila',
      postal_code: '1000',
      country: 'PH'
    }
  },
  'Badminton Court Booking',
  { reservation_id: 123 },
  123 // reservation ID
);
```

### Using the Payment Form Component

```tsx
import { PaymongoPaymentModal } from '../components/PaymongoPaymentModal';

function BookingPage() {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1000);

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    // Handle successful payment
  };

  return (
    <div>
      {/* Your booking form */}
      <button onClick={() => setShowPayment(true)}>
        Proceed to Payment
      </button>

      <PaymongoPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={paymentAmount}
        description="Badminton Court Booking"
        reservationId={123}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
```

## Payment Methods Supported

1. **Credit/Debit Card**
   - Visa, Mastercard, American Express
   - 3D Secure authentication
   - Card details: number, expiry, CVC

2. **GCash**
   - Mobile wallet payment
   - Redirects to GCash app/website

3. **PayMaya**
   - Mobile wallet payment
   - Redirects to PayMaya app/website

4. **GrabPay**
   - Mobile wallet payment
   - Redirects to GrabPay app/website

## Email Receipts

The system automatically sends email receipts when payments are successful:

1. **Payment Confirmation** - Sent immediately after successful payment
2. **Detailed Receipt** - Sent via webhook when payment is fully processed

Email templates are located in:
- `backend/src/templates/payment-receipt.hbs`
- `backend/src/templates/payment-confirmation.hbs`

## Webhook Configuration

To receive payment status updates, configure your Paymongo webhook:

1. Go to Paymongo Dashboard
2. Navigate to Webhooks section
3. Add webhook URL: `https://yourdomain.com/api/webhook/paymongo`
4. Select events: `payment.paid`, `payment.failed`, `payment_intent.succeeded`, `payment_intent.failed`

## Error Handling

The integration includes comprehensive error handling:

- API errors are caught and returned with descriptive messages
- Network errors are handled gracefully
- Payment failures are logged and can be retried
- Webhook signature verification (implement in production)

## Testing

Use the following test card numbers for testing:

- **Successful Payment**: `4242424242424242`
- **Declined Payment**: `4000000000000002`
- **Requires Authentication**: `4000002500003155`

## Security Considerations

1. **API Keys**: Store secret keys securely in environment variables
2. **Webhook Verification**: Implement proper signature verification
3. **HTTPS**: Always use HTTPS in production
4. **PCI Compliance**: Card details are handled by Paymongo (PCI compliant)

## Production Setup

1. Replace test API keys with live keys
2. Update webhook URLs to production domain
3. Configure email SMTP settings
4. Implement proper webhook signature verification
5. Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**
   - Check API keys are correct
   - Verify amount is in centavos (multiply by 100)
   - Check network connectivity

2. **Payment Method Attachment Fails**
   - Ensure payment method is created first
   - Verify payment intent is in correct state
   - Check billing information is complete

3. **Webhook Not Receiving Events**
   - Verify webhook URL is accessible
   - Check webhook configuration in Paymongo dashboard
   - Ensure webhook endpoint returns 200 status

4. **Email Not Sending**
   - Check SMTP configuration
   - Verify email templates exist
   - Check email service logs

### Debug Mode

Enable debug logging by setting:
```typescript
// In paymongo.service.ts
private readonly logger = new Logger(PayMongoService.name);
// Logs will appear in console
```

## Support

For issues with the Paymongo integration:
1. Check the logs for error messages
2. Verify API keys and configuration
3. Test with Paymongo's test environment
4. Contact Paymongo support for API-related issues
