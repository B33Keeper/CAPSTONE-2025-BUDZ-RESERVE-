# Complete Guide: Setting Up ngrok and PayMongo Webhooks

This guide will walk you through setting up ngrok to receive PayMongo webhooks on your local development server.

---

## Prerequisites

- Backend server running on port 3001
- PayMongo account (test or live)
- PayMongo API keys configured in your `.env` file

---

## Step 1: Install ngrok

### Option A: Download ngrok (Recommended)

1. Go to https://ngrok.com/download
2. Download ngrok for your operating system (Windows/Mac/Linux)
3. Extract the downloaded file
4. **For Windows:**
   - Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)
   - Add the folder to your system PATH, OR
   - Use the full path when running commands

### Option B: Install via Package Manager

**Windows (using Chocolatey):**
```powershell
choco install ngrok
```

**Mac (using Homebrew):**
```bash
brew install ngrok
```

**Linux:**
```bash
# Download and install
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

---

## Step 2: Sign Up for ngrok (Optional but Recommended)

1. Go to https://dashboard.ngrok.com/signup
2. Create a free account
3. Get your authtoken from the dashboard: https://dashboard.ngrok.com/get-started/your-authtoken
4. Configure ngrok with your authtoken:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

**Why sign up?**
- Free accounts get longer session times
- You can see webhook requests in the ngrok dashboard
- Better for debugging

---

## Step 3: Start Your Backend Server

Make sure your backend is running:

```bash
cd backend
npm run start:dev
```

Verify it's running on port 3001 by checking:
- Backend logs show server started
- You can access `http://localhost:3001/api/health` (if health endpoint exists)

---

## Step 4: Start ngrok Tunnel

Open a **new terminal/command prompt** (keep your backend running in the first terminal).

### Windows:
```powershell
# If ngrok is in PATH:
ngrok http 3001

# OR if using full path:
C:\ngrok\ngrok.exe http 3001
```

### Mac/Linux:
```bash
ngrok http 3001
```

### Expected Output:
```
ngrok                                                                              
                                                                                   
Session Status                online                                               
Account                       Your Name (Plan: Free)                               
Version                       3.x.x                                                
Region                        United States (us)                                   
Latency                       -                                                    
Web Interface                 http://127.0.0.1:4040                               
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3001
                                                                                   
Connections                   ttl     opn     rt1     rt5     p50     p90         
                              0       0       0.00    0.00    0.00    0.00        
```

**Important:** Copy the `Forwarding` URL (e.g., `https://abc123def456.ngrok-free.app`). This is your public URL.

**Note:** 
- The URL changes every time you restart ngrok (unless you have a paid plan)
- Keep this terminal open - closing it will stop the tunnel

---

## Step 5: Access ngrok Web Interface (Optional)

Open http://127.0.0.1:4040 in your browser to see:
- All HTTP requests going through ngrok
- Request/response details
- Useful for debugging webhook calls

---

## Step 6: Configure PayMongo Webhook

### 6.1. Log in to PayMongo Dashboard

1. Go to https://dashboard.paymongo.com/
2. Log in with your PayMongo account
3. Make sure you're in the correct environment (Test or Live)

### 6.2. Navigate to Webhooks

1. In the left sidebar, click **"Developers"**
2. Click **"Webhooks"**
3. You'll see a list of existing webhooks (if any)

### 6.3. Create New Webhook

1. Click the **"Create Webhook"** button (usually top right)
2. Fill in the webhook details:

   **Endpoint URL:**
   ```
   https://YOUR_NGROK_URL.ngrok-free.app/api/webhook/paymongo
   ```
   
   Replace `YOUR_NGROK_URL` with your actual ngrok URL from Step 4.
   
   Example:
   ```
   https://abc123def456.ngrok-free.app/api/webhook/paymongo
   ```

   **Events to Listen To:**
   Check the following events:
   - ✅ `payment.paid` - When a payment is successfully completed
   - ✅ `checkout_session.payment.paid` - When a checkout session payment is paid
   - ✅ `payment.failed` - When a payment fails
   - ✅ `payment_intent.succeeded` - When a payment intent succeeds
   - ✅ `payment_intent.failed` - When a payment intent fails

3. Click **"Create Webhook"**

### 6.4. Copy Webhook Secret

After creating the webhook:

1. You'll see the webhook details page
2. **Copy the "Webhook Secret"** - it starts with `whsk_`
   - Example: `whsk_test_abc123def456...`
3. **Keep this secret safe** - you'll need it in the next step

---

## Step 7: Configure Backend Environment

### 7.1. Update `.env` File

Open your backend `.env` file and add/update the webhook secret:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
PAYMONGO_WEBHOOK_SECRET=whsk_test_your_webhook_secret_here
```

**Important:** 
- Replace `whsk_test_your_webhook_secret_here` with the actual webhook secret from Step 6.4
- Make sure there are no extra spaces or quotes

### 7.2. Restart Backend Server

After updating the `.env` file:

1. Stop your backend server (Ctrl+C)
2. Start it again:
   ```bash
   npm run start:dev
   ```

---

## Step 8: Test the Webhook Setup

### 8.1. Make a Test Payment

1. Go to your booking page
2. Complete a test booking
3. Complete the payment through PayMongo
4. After payment, PayMongo will send a webhook to your ngrok URL

### 8.2. Check Webhook Delivery

**Option A: Check ngrok Web Interface**
1. Open http://127.0.0.1:4040
2. You should see incoming POST requests to `/api/webhook/paymongo`
3. Click on a request to see details

**Option B: Check Backend Logs**
Look for log messages like:
```
[WebhookController] Paymongo webhook received
[WebhookController] Processing payment.paid event
[WebhookController] Created reservation 123
```

**Option C: Check PayMongo Dashboard**
1. Go to Developers → Webhooks
2. Click on your webhook
3. Check the "Events" tab to see webhook delivery status
4. Green checkmark = successful delivery
5. Red X = failed delivery (check the error message)

### 8.3. Verify Reservation Created

1. Open "My Reservations" modal in your app
2. Your reservation should appear
3. Check the database to confirm the reservation was created

---

## Step 9: Troubleshooting

### Problem: Webhook not received

**Check:**
1. ✅ Is ngrok running? (Check the terminal)
2. ✅ Is backend running on port 3001?
3. ✅ Is the webhook URL correct in PayMongo dashboard?
4. ✅ Did you restart backend after adding webhook secret?

**Solution:**
- Check ngrok web interface (http://127.0.0.1:4040) for incoming requests
- Check backend logs for webhook attempts
- Verify webhook URL in PayMongo matches your ngrok URL

### Problem: "Invalid webhook signature" error

**Check:**
1. ✅ Is `PAYMONGO_WEBHOOK_SECRET` set in `.env`?
2. ✅ Does the secret match the one from PayMongo dashboard?
3. ✅ Did you restart backend after updating `.env`?

**Solution:**
- Double-check the webhook secret in `.env` matches PayMongo dashboard
- Make sure there are no extra spaces or quotes
- Restart backend server

### Problem: ngrok URL changed

**What happened:**
- Every time you restart ngrok, you get a new URL
- Your PayMongo webhook still points to the old URL

**Solution:**
1. Get your new ngrok URL
2. Go to PayMongo Dashboard → Developers → Webhooks
3. Click on your webhook
4. Click "Edit" or delete and recreate with new URL
5. Update the webhook URL

**Alternative (for paid ngrok users):**
- Use a static domain: `ngrok http 3001 --domain=your-static-domain.ngrok.app`

### Problem: Webhook received but reservation not created

**Check backend logs for:**
- Error messages during webhook processing
- Missing booking data in metadata
- Database connection issues

**Solution:**
- Check backend logs for detailed error messages
- Verify booking data is included in checkout session metadata
- Check database connection

---

## Step 10: Production Deployment

When deploying to production:

1. **Don't use ngrok** - your production server should have a public URL
2. **Update webhook URL** in PayMongo dashboard to your production URL:
   ```
   https://yourdomain.com/api/webhook/paymongo
   ```
3. **Update webhook secret** in production `.env` file
4. **Test webhook** with a real payment

---

## Quick Reference

### Starting ngrok:
```bash
ngrok http 3001
```

### Webhook URL Format:
```
https://YOUR_NGROK_URL.ngrok-free.app/api/webhook/paymongo
```

### Required Environment Variables:
```env
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_test_...
```

### Useful URLs:
- ngrok Dashboard: http://127.0.0.1:4040
- PayMongo Dashboard: https://dashboard.paymongo.com/
- Webhook Endpoint: `/api/webhook/paymongo`

---

## Tips

1. **Keep ngrok running** - Don't close the ngrok terminal while testing
2. **Monitor ngrok dashboard** - Great for debugging webhook issues
3. **Use test mode** - Always test with PayMongo test keys first
4. **Check logs** - Backend logs show webhook processing details
5. **Save webhook secret** - Keep it secure and don't commit to git

---

## Next Steps

After setting up webhooks:
1. ✅ Test with a real payment
2. ✅ Verify reservation appears in "My Reservations"
3. ✅ Check PayMongo payment details are fetched correctly
4. ✅ Test different payment methods (GCash, PayMaya, etc.)

---

## Need Help?

- ngrok Documentation: https://ngrok.com/docs
- PayMongo Webhook Docs: https://developers.paymongo.com/docs/webhooks
- Check backend logs for detailed error messages
- Use ngrok web interface to inspect requests

