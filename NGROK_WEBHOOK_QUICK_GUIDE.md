# Step-by-Step Guide: ngrok and PayMongo Webhook Setup

Follow these steps in order to set up ngrok and configure PayMongo webhooks.

---

## Part 1: Install and Configure ngrok

### Step 1: Download ngrok

1. Go to https://ngrok.com/download
2. Download ngrok for Windows
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)
4. **Optional:** Add the folder to your system PATH

### Step 2: Sign Up for ngrok Account

1. Go to https://dashboard.ngrok.com/signup
2. Create a free account
3. Complete the onboarding:
   - **Role:** Select "Developer"
   - **Use case:** Select "Testing Webhooks on local"
   - **Purpose:** Select "Development"
   - Click "Continue"

### Step 3: Get Your Authtoken

1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
2. **Copy your authtoken** - it should look like:
   ```
   2abc123def456ghi789jkl012mno345pqr678...
   ```
   - Usually starts with `2_` followed by a long string
   - Make sure you copy the ENTIRE token

### Step 4: Configure ngrok with Authtoken

Open PowerShell/Command Prompt and run:

```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

**Replace `YOUR_AUTHTOKEN_HERE` with the actual authtoken you copied.**

**Expected output:**
```
Authtoken saved to configuration file: C:\Users\YourName\AppData\Local\ngrok\ngrok.yml
```

---

## Part 2: Start Your Backend Server

### Step 5: Start Backend

1. Open PowerShell/Command Prompt
2. Navigate to your backend directory:
   ```powershell
   cd C:\Users\seyra\CAPSTONE-2025-BUDZ-RESERVE-\backend
   ```
3. Start the server:
   ```powershell
   npm run start:dev
   ```
4. **Wait for the server to start** - you should see:
   ```
   [Nest] Application successfully started on port 3001
   ```
5. **Keep this terminal open** - don't close it!

---

## Part 3: Start ngrok Tunnel

### Step 6: Start ngrok

1. **Open a NEW PowerShell/Command Prompt window** (keep the backend running)
2. Run:
   ```powershell
   ngrok http 3001
   ```
   
   **If ngrok is not in PATH, use full path:**
   ```powershell
   C:\ngrok\ngrok.exe http 3001
   ```

### Step 7: Copy Your ngrok URL

You should see output like this:

```
ngrok                                                                              
                                                                                   
Session Status                online                                               
Account                       Your Name (Plan: Free)                               
Version                       3.x.x                                                
Region                        United States (us)                                   
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3001
                                                                                   
Connections                   ttl     opn     rt1     rt5     p50     p90         
                              0       0       0.00    0.00    0.00    0.00        
```

**Copy the Forwarding URL:**
```
https://abc123def456.ngrok-free.app
```

**Important:**
- Keep this terminal open - closing it will stop the tunnel
- The URL changes every time you restart ngrok (unless you have a paid plan)
- You can also view requests at: http://127.0.0.1:4040

---

## Part 4: Configure PayMongo Webhook

### Step 8: Log in to PayMongo Dashboard

1. Go to https://dashboard.paymongo.com/
2. Log in with your PayMongo account
3. Make sure you're in **Test Mode** (for testing) or **Live Mode** (for production)

### Step 9: Navigate to Webhooks

1. In the left sidebar, click **"Developers"**
2. Click **"Webhooks"**
3. You'll see a list of existing webhooks (if any)

### Step 10: Create New Webhook

1. Click the **"Create Webhook"** button (usually top right or in the center)
2. Fill in the webhook details:

   **Endpoint URL:**
   ```
   https://YOUR_NGROK_URL.ngrok-free.app/api/webhook/paymongo
   ```
   
   **Replace `YOUR_NGROK_URL` with your actual ngrok URL from Step 7.**
   
   **Example:**
   ```
   https://abc123def456.ngrok-free.app/api/webhook/paymongo
   ```

3. **Select Events:**
   Check the following events (click the checkboxes):
   - ✅ `payment.paid` - When a payment is successfully completed
   - ✅ `checkout_session.payment.paid` - When a checkout session payment is paid
   - ✅ `payment.failed` - When a payment fails
   - ✅ `payment_intent.succeeded` - When a payment intent succeeds
   - ✅ `payment_intent.failed` - When a payment intent fails

4. Click **"Create Webhook"**

### Step 11: Copy Webhook Secret

After creating the webhook:

1. You'll see the webhook details page
2. **Find the "Webhook Secret"** - it starts with `whsk_`
   - Example: `whsk_test_abc123def456...`
3. **Copy the entire secret** - you'll need it in the next step

---

## Part 5: Configure Backend Environment

### Step 12: Update Backend .env File

1. Open your backend `.env` file:
   ```
   C:\Users\seyra\CAPSTONE-2025-BUDZ-RESERVE-\backend\.env
   ```

2. Find or add this line:
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsk_test_your_webhook_secret_here
   ```

3. **Replace `whsk_test_your_webhook_secret_here` with the actual webhook secret from Step 11**

   **Example:**
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsk_test_abc123def456ghi789jkl012mno345pqr678
   ```

4. **Save the file**

### Step 13: Restart Backend Server

1. Go back to the terminal where your backend is running
2. Press `Ctrl + C` to stop the server
3. Start it again:
   ```powershell
   npm run start:dev
   ```
4. Wait for the server to start successfully

---

## Part 6: Test the Setup

### Step 14: Make a Test Payment

1. Open your frontend application
2. Go to the booking page
3. Complete a test booking
4. Complete the payment through PayMongo
5. After payment, PayMongo will send a webhook to your ngrok URL

### Step 15: Verify Webhook Delivery

**Option A: Check ngrok Web Interface**
1. Open http://127.0.0.1:4040 in your browser
2. You should see incoming POST requests to `/api/webhook/paymongo`
3. Click on a request to see the details

**Option B: Check Backend Logs**
Look in your backend terminal for messages like:
```
[WebhookController] Paymongo webhook received
[WebhookController] Processing payment.paid event
[WebhookController] Created reservation 123
```

**Option C: Check PayMongo Dashboard**
1. Go to Developers → Webhooks
2. Click on your webhook
3. Check the "Events" tab
4. Green checkmark = successful delivery
5. Red X = failed delivery (check error message)

### Step 16: Verify Reservation Created

1. Open "My Reservations" modal in your app
2. Your reservation should appear
3. Check that the payment status is correct

---

## Troubleshooting

### Problem: "Invalid webhook signature" error

**Solution:**
- Double-check `PAYMONGO_WEBHOOK_SECRET` in `.env` matches PayMongo dashboard
- Make sure there are no extra spaces or quotes
- Restart backend after updating `.env`

### Problem: Webhook not received

**Check:**
- ✅ Is ngrok running? (Check the ngrok terminal)
- ✅ Is backend running on port 3001?
- ✅ Is webhook URL correct in PayMongo dashboard?
- ✅ Did you restart backend after adding webhook secret?

**Solution:**
- Check ngrok web interface: http://127.0.0.1:4040
- Check backend logs for webhook attempts
- Verify webhook URL in PayMongo matches your ngrok URL

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

---

## Quick Reference Checklist

- [ ] ngrok downloaded and installed
- [ ] ngrok account created
- [ ] Authtoken configured: `ngrok config add-authtoken YOUR_TOKEN`
- [ ] Backend server running on port 3001
- [ ] ngrok tunnel started: `ngrok http 3001`
- [ ] ngrok URL copied (e.g., `https://abc123.ngrok-free.app`)
- [ ] PayMongo webhook created with correct URL
- [ ] Webhook secret copied from PayMongo
- [ ] `PAYMONGO_WEBHOOK_SECRET` added to backend `.env`
- [ ] Backend restarted after updating `.env`
- [ ] Test payment made
- [ ] Webhook received (check ngrok dashboard or backend logs)
- [ ] Reservation appears in "My Reservations"

---

## Important Notes

1. **Keep ngrok running** - Don't close the ngrok terminal while testing
2. **URL changes** - Each time you restart ngrok, you get a new URL (update PayMongo webhook)
3. **Monitor requests** - Use http://127.0.0.1:4040 to see all webhook requests
4. **Test mode** - Always test with PayMongo test keys first
5. **Save secrets** - Keep webhook secret secure, don't commit to git

---

## Next Steps After Setup

Once everything is working:
1. ✅ Test with different payment methods (GCash, PayMaya, etc.)
2. ✅ Verify reservations appear correctly
3. ✅ Check PayMongo payment details are fetched
4. ✅ Test webhook retry scenarios
5. ✅ Plan for production deployment (use real domain, not ngrok)

---

## Need Help?

- ngrok Dashboard: https://dashboard.ngrok.com/
- ngrok Docs: https://ngrok.com/docs
- PayMongo Dashboard: https://dashboard.paymongo.com/
- PayMongo Webhook Docs: https://developers.paymongo.com/docs/webhooks

