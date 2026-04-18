# Resend Email Service Setup Guide

## Overview
Your S-CORE application has been successfully migrated from Gmail SMTP to **Resend** - a modern, reliable email API service.

## What Changed

### 1. Package Dependencies
- ❌ Removed: `nodemailer` (SMTP-based)
- ✅ Added: `resend` (v4.0.1) - Modern email API

### 2. Environment Variables
The `.env` file has been updated:

**Before (Gmail SMTP):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=strategiccommunicationsemail@gmail.com
SMTP_PASSWORD=lsmjfpnyhxzojgra
SMTP_FROM_EMAIL=strategiccommunicationsemail@gmail.com
SMTP_FROM_NAME=SCO Creative Optimization for Requests and Engagement System
SMTP_SECURE=false
```

**After (Resend):**
```env
RESEND_API_KEY=your_resend_api_key_here
SMTP_FROM_EMAIL=strategiccommunicationsemail@gmail.com
SMTP_FROM_NAME=SCO Creative Optimization for Requests and Engagement System
```

### 3. Email Service Implementation
- Replaced `nodemailer.createTransport()` with Resend client
- Updated all email sending methods to use `resend.emails.send()`
- Maintained all existing email templates and functionality

## Setup Instructions

### Step 1: Get Your Resend API Key

1. **Sign up for Resend:**
   - Go to [https://resend.com](https://resend.com)
   - Click "Start Building" or "Sign Up"
   - Create an account (free tier available)

2. **Verify Your Domain:**
   - In the Resend dashboard, go to "Domains"
   - Add your domain (e.g., `dlsud.edu.ph` or `dlsuds-core.me`)
   - Follow DNS verification steps (add TXT, MX, CNAME records)
   - Wait for verification (usually takes a few minutes to an hour)

3. **Create an API Key:**
   - Go to "API Keys" in the dashboard
   - Click "Create API Key"
   - Give it a name (e.g., "S-CORE Production")
   - Copy the generated API key (starts with `re_`)

### Step 2: Update Environment Variables

Update your `.env` file with the Resend API key:

```env
# Replace 'your_resend_api_key_here' with your actual API key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Update the from email to use your verified domain
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=SCO Creative Optimization for Requests and Engagement System
```

### Step 3: Update From Email Address

**Important:** The `from` email must use your verified domain.

If you verified `dlsud.edu.ph`:
```env
SMTP_FROM_EMAIL=noreply@dlsud.edu.ph
# or
SMTP_FROM_EMAIL=sco@dlsud.edu.ph
```

If you verified `dlsuds-core.me`:
```env
SMTP_FROM_EMAIL=noreply@dlsuds-core.me
```

### Step 4: Test the Email Service

1. **Start your server:**
   ```bash
   node server.js
   ```

2. **Test email sending:**
   You can test the email service by:
   - Registering a new account (triggers verification email)
   - Using the admin panel to send test notifications
   - Using the test endpoint if available

## Benefits of Resend

✅ **Reliability:** Industry-leading email delivery rates  
✅ **Simplicity:** Clean API, no SMTP configuration needed  
✅ **Modern:** Built for developers with great documentation  
✅ **Analytics:** Track email delivery and opens  
✅ **Free Tier:** 3,000 emails/month free forever  
✅ **No App Passwords:** No need to manage Gmail app passwords  

## Troubleshooting

### Email not sending

1. **Check API key:**
   ```bash
   # In your terminal
   echo $env:RESEND_API_KEY
   ```
   Make sure it's set and starts with `re_`

2. **Check domain verification:**
   - Log in to Resend dashboard
   - Ensure your domain shows as "Verified"

3. **Check from address:**
   - Must match your verified domain
   - Cannot use Gmail or other external domains

4. **Check logs:**
   ```bash
   # Server console will show:
   [EMAIL] Email service initialized with Resend API
   [EMAIL] Email sent successfully to user@example.com
   ```

### Development Mode

If `RESEND_API_KEY` is not set or still says `your_resend_api_key_here`, the service runs in development mode:

```
[EMAIL] Resend API key not configured - email service in development mode
[EMAIL] Development mode - would send email to: user@example.com
```

This is useful for local development without actual email sending.

## Migration Checklist

- [x] Install Resend package
- [x] Update emailService.js to use Resend
- [x] Update environment variables
- [ ] Sign up for Resend account
- [ ] Verify your domain in Resend
- [ ] Get API key from Resend
- [ ] Update RESEND_API_KEY in .env
- [ ] Update SMTP_FROM_EMAIL to use verified domain
- [ ] Test email sending
- [ ] Deploy to production

## API Differences

### Nodemailer (Old)
```javascript
await transporter.sendMail({
  from: 'email@example.com',
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Content</p>'
});
```

### Resend (New)
```javascript
await resend.emails.send({
  from: 'Name <email@example.com>',
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Content</p>'
});
```

## Support

- **Resend Documentation:** [https://resend.com/docs](https://resend.com/docs)
- **Resend Support:** [https://resend.com/support](https://resend.com/support)
- **Domain Verification Guide:** [https://resend.com/docs/dashboard/domains/introduction](https://resend.com/docs/dashboard/domains/introduction)

## Notes

- All existing email templates remain unchanged
- All email methods maintain the same signature
- Reply-to addresses are preserved
- Development mode works without API key for testing
