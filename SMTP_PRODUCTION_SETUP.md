# SMTP Email Setup for Production

This guide will help you configure email functionality for your production deployment.

## ✅ Changes Made

The application has been updated to:
- **Send OTPs via email** in production (no OTPs in API responses)
- **Require proper SMTP configuration** for email functionality
- **Throw proper errors** if email fails (no fallback to returning OTPs)
- **Only use dummy transport** if explicitly disabled via `SKIP_SMTP=true`

## 📧 Setting Up SMTP

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Step Verification** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Budz Reserve" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Set Environment Variables** (Railway/Production):
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=noreply@budzreserve.com
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Sign up for SendGrid** (Free tier: 100 emails/day)
   - Go to: https://sendgrid.com
   - Create an account

2. **Create an API Key**
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key

3. **Set Environment Variables**:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=noreply@budzreserve.com
   ```

### Option 3: Mailgun

1. **Sign up for Mailgun** (Free tier: 5,000 emails/month)
   - Go to: https://www.mailgun.com
   - Create an account

2. **Get SMTP Credentials**
   - Go to Sending → Domain Settings
   - Copy SMTP credentials

3. **Set Environment Variables**:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-mailgun-username
   SMTP_PASS=your-mailgun-password
   SMTP_FROM=noreply@budzreserve.com
   ```

### Option 4: AWS SES (For High Volume)

1. **Set up AWS SES**
   - Go to AWS Console → SES
   - Verify your domain/email
   - Create SMTP credentials

2. **Set Environment Variables**:
   ```
   SMTP_HOST=email-smtp.region.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   SMTP_FROM=noreply@yourdomain.com
   ```

## 🚂 Railway Deployment

### Setting Environment Variables on Railway

1. Go to your Railway project dashboard
2. Select your **backend service**
3. Go to the **Variables** tab
4. Click **+ New Variable** for each:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

5. **Important Notes:**
   - Railway **Free/Trial plans block outbound SMTP connections**
   - You need **Railway Pro+ plan** for SMTP to work
   - Alternatively, use an email API service (SendGrid, Mailgun) which works on all plans

### Testing Email Configuration

After setting environment variables:

1. **Redeploy your backend service**
2. **Check the logs** for:
   - ✅ `📧 Configuring SMTP: smtp.gmail.com:587` (success)
   - ❌ `⚠️ SMTP credentials not configured` (missing credentials)

3. **Test the forgot password flow:**
   - Request password reset
   - Check your email inbox (and spam folder)
   - You should receive the OTP email

## 🔧 Troubleshooting

### Email Not Sending

1. **Check Environment Variables:**
   - Verify all SMTP variables are set correctly
   - No extra spaces or quotes
   - App password is correct (for Gmail)

2. **Check Backend Logs:**
   - Look for `✅ Email sent successfully to: [email]`
   - Or error messages like `❌ Email sending failed`

3. **Common Issues:**
   - **Gmail:** Make sure you're using App Password, not regular password
   - **Railway Free Plan:** Upgrade to Pro+ or use SendGrid/Mailgun
   - **Port 587 blocked:** Try port 465 with `secure: true`
   - **Firewall:** Check if SMTP ports are blocked

### Connection Errors

If you see errors like:
- `ECONNREFUSED`
- `ETIMEDOUT`
- `Connection timeout`

**Solutions:**
1. Verify SMTP credentials are correct
2. Check if your hosting provider blocks SMTP (Railway free plans do)
3. Try a different SMTP service (SendGrid, Mailgun)
4. Check firewall/network settings

### Testing Locally

For local development, create `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@budzreserve.com
```

## 🚫 Disabling Email (Testing Only)

If you need to disable email for testing, set:

```
SKIP_SMTP=true
```

**⚠️ WARNING:** This is for testing only! Emails will NOT be sent. Do NOT use in production.

## 📝 Email Template

The OTP email uses the template at:
- `backend/src/templates/forgot-password.hbs`

You can customize this template to match your branding.

## ✅ Verification Checklist

- [ ] SMTP environment variables set in Railway/production
- [ ] Backend logs show "Configuring SMTP" (not "dummy transport")
- [ ] Test forgot password flow
- [ ] OTP email received in inbox
- [ ] Email template looks correct
- [ ] No errors in backend logs

## 🆘 Still Having Issues?

1. Check backend logs for detailed error messages
2. Verify SMTP credentials are correct
3. Test SMTP connection using a tool like `telnet` or `curl`
4. Try a different email service (SendGrid, Mailgun)
5. Check your hosting provider's SMTP restrictions

