# OTP Email Troubleshooting Guide

## Problem
You're not receiving OTP emails when using the forgot password feature.

## Solutions

### 1. Check if `.env` file exists

Make sure you have a `.env` file in the `backend` directory. If it doesn't exist:

1. Copy the example file:
   ```bash
   cd backend
   cp env.exampl .env
   ```

2. Or create a new `.env` file with the following SMTP configuration:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@budzreserve.com
   ```

### 2. Verify Gmail App Password

If you're using Gmail, you need to use an **App Password**, not your regular Gmail password.

#### Steps to create a Gmail App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (must be enabled)
3. Scroll down to **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "Budz Reserve" as the name
6. Click **Generate**
7. Copy the 16-character password (no spaces)
8. Use this password in your `.env` file as `SMTP_PASS`

### 3. Check Gmail Security Settings

- Make sure **2-Step Verification** is enabled
- Make sure **Less secure app access** is NOT the issue (App Passwords are the correct method)
- Check if Gmail is blocking the connection (check Gmail security alerts)

### 4. Verify Environment Variables

Make sure your `.env` file has the correct values:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=budzb58@gmail.com
SMTP_PASS=bjpcniznrcyitwcd
SMTP_FROM=noreply@budzreserve.com
```

**Important:** 
- `SMTP_USER` should be your full Gmail address
- `SMTP_PASS` should be your 16-character App Password (not your regular password)
- Make sure there are no extra spaces or quotes around the values

### 5. Restart the Backend Server

After updating the `.env` file, restart your backend server:

```bash
# If using npm
npm run start:dev

# If using Docker
docker-compose restart backend
```

### 6. Check Backend Logs

When you request a password reset, check the backend console logs for:

- ✅ `Email sent successfully to: [email]` - Email was sent
- ❌ `Email sending failed:` - Email failed (check error details)
- ⚠️ `SMTP credentials not configured` - No SMTP credentials found

### 7. Development Mode Fallback

If SMTP is not configured, the system will:
- Generate an OTP
- Display it in the backend console
- Return it in the API response (development mode only)
- Show it in the frontend toast notification

**Note:** In production, email failures will throw an error instead of showing the OTP.

### 8. Test Email Configuration

You can test if your SMTP configuration is working by:

1. Starting the backend server
2. Looking for this message in the console:
   - If you see: `⚠️ SMTP credentials not configured` → Your `.env` file is not being read or credentials are missing
   - If you don't see this warning → SMTP is configured

3. Try the forgot password flow and check:
   - Backend console for email sending status
   - Your email inbox (and spam folder)
   - Frontend toast notifications

### 9. Alternative: Use a Different Email Service

If Gmail doesn't work, you can use other SMTP services:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

**Outlook/Office365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### 10. Common Issues

**Issue:** "SMTP credentials not configured" warning
- **Solution:** Create/update `.env` file in the `backend` directory

**Issue:** "Invalid login" or "Authentication failed"
- **Solution:** Use Gmail App Password, not regular password

**Issue:** "Connection timeout"
- **Solution:** Check firewall/network settings, verify SMTP_HOST and SMTP_PORT

**Issue:** Email goes to spam
- **Solution:** Check SPF/DKIM records, use a proper `SMTP_FROM` address

## Quick Fix Checklist

- [ ] `.env` file exists in `backend` directory
- [ ] `SMTP_USER` and `SMTP_PASS` are set in `.env`
- [ ] Using Gmail App Password (not regular password)
- [ ] Backend server restarted after `.env` changes
- [ ] Checked backend console logs for errors
- [ ] Checked email spam folder
- [ ] Verified Gmail 2-Step Verification is enabled

## Still Not Working?

1. Check the backend console for detailed error messages
2. Verify the `.env` file is in the correct location (`backend/.env`)
3. Make sure environment variables are being loaded (check `app.module.ts` for env file paths)
4. Try using a different email service (SendGrid, Mailgun, etc.)
5. In development mode, the OTP will be shown in the frontend if email fails

