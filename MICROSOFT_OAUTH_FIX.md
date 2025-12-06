# Microsoft OAuth Setup - Fixed for Express.js

## What Was Wrong

The previous implementation was trying to use Next.js Clerk components (`@clerk/nextjs`) in an **Express.js** application. This doesn't work because:
- Next.js uses React components that don't exist in Express
- The middleware approach is completely different
- Clerk has different SDKs for different frameworks

## What Was Fixed

1. **Removed Next.js references** - We're now using `@clerk/clerk-sdk-node` and `@clerk/express`
2. **Added Clerk Express middleware** - Proper integration in `server.js`
3. **Created dedicated Clerk routes** - New `routes/clerk.js` file
4. **Updated button links** - Now point to `/clerk/sign-in` and `/clerk/sign-up`
5. **Added Microsoft button to login page** - Users can sign in OR sign up with Microsoft

## How It Works Now

### User Flow:
1. User clicks "Continue with Microsoft" on login or registration page
2. Redirected to Clerk's hosted sign-in/sign-up page
3. User authenticates with Microsoft @dlsud.edu.ph account
4. Clerk redirects back to `/clerk/callback`
5. System checks if user exists:
   - **Existing user**: Auto-login and redirect to dashboard
   - **New user**: Pre-fill registration form with Microsoft data

### Routes Created:
- `GET /clerk/sign-in` - Redirects to Clerk hosted sign-in
- `GET /clerk/sign-up` - Redirects to Clerk hosted sign-up  
- `GET /clerk/callback` - Handles OAuth callback and user sync
- `GET /clerk/user` - Debug endpoint to check Clerk user data

## Clerk Dashboard Configuration

### Step 1: Configure Microsoft OAuth in Clerk

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "User & Authentication" → "Social Connections"
4. Enable "Microsoft"
5. Add these redirect URLs:
   ```
   https://kind-crow-61.clerk.accounts.dev/v1/oauth_callback
   http://localhost:8080/clerk/callback (for local testing)
   ```

### Step 2: Configure Domain Restrictions

Since Clerk's free tier doesn't support allowlist, we handle this in our callback:
- Clerk authenticates the user
- Our `/clerk/callback` checks if email ends with @dlsud.edu.ph
- Rejects if not

### Step 3: Azure AD Setup (Already Done)

Your Azure AD app should have:
- **Redirect URI**: `https://kind-crow-61.clerk.accounts.dev/v1/oauth_callback`
- **API Permissions**: openid, profile, email, User.Read
- Copy Client ID and Secret to Clerk dashboard

## Testing

### 1. Start the server:
```bash
node server.js
```

### 2. Test Login with Microsoft:
1. Go to `http://localhost:8080`
2. Click "Continue with Microsoft"
3. Should redirect to Clerk's sign-in page
4. Sign in with @dlsud.edu.ph account
5. Should redirect back and auto-login (if registered) or go to registration

### 3. Test Registration with Microsoft:
1. Go to `http://localhost:8080/register`
2. Click "Continue with Microsoft Account"
3. Should redirect to Clerk's sign-up page
4. Sign in with @dlsud.edu.ph account
5. Should redirect back with pre-filled email and name

### 4. Check for errors:
- Look at server console for debug logs
- Check browser console for JavaScript errors
- Try the debug endpoint: `http://localhost:8080/clerk/user` (when authenticated)

## Troubleshooting

### "Microsoft button not loading"
**Cause**: The href was pointing to Clerk's hosted page directly
**Fixed**: Now points to `/clerk/sign-up` which properly redirects

### "req.auth is undefined"
**Cause**: ClerkExpressWithAuth middleware not initialized
**Fixed**: Added to `server.js` before routes

### "Session token not found"
**Cause**: Wrong callback implementation
**Fixed**: Using `req.auth` from middleware instead of manual token parsing

### "Email not verified" error
**Cause**: Microsoft OAuth should auto-verify email
**Fixed**: `extractClerkProfile` checks Clerk's verification status

## Environment Variables

Make sure these are in `.env`:
```env
CLERK_PUBLISHABLE_KEY=pk_test_a2luZC1jcm93LTYxLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_Sex17tAi2ZPuFm2oYr4TyduqHbSaqEdBOfo0zNKr7Y
APP_URL=http://localhost:8080
ALLOWED_DOMAIN=dlsud.edu.ph
```

## Key Differences from Next.js

| Next.js | Express.js (Our Fix) |
|---------|---------------------|
| `middleware.ts` file | `ClerkExpressWithAuth()` in server.js |
| `<ClerkProvider>` | Not needed (handled by middleware) |
| `<SignInButton>` | Regular `<a>` tags with `/clerk/sign-in` |
| `useUser()` hook | `req.auth` from middleware |
| Automatic routing | Manual route handlers in `routes/clerk.js` |

## What to Expect

### Login Page:
- Username/password form (existing)
- **NEW**: "OR CONTINUE WITH" divider
- **NEW**: Microsoft OAuth button

### Registration Page:
- Full registration form (existing)
- **NEW**: "OR SIGN UP WITH" divider
- **NEW**: Microsoft OAuth button
- **NEW**: Pre-fill when coming from Microsoft

### After Microsoft Auth:
- **Existing users**: Auto-login
- **New users**: Registration form with email/name pre-filled
- **Invalid domain**: Error message "Only @dlsud.edu.ph emails allowed"

## Files Changed

1. ✅ `config/clerk.js` - Fixed Clerk initialization for Express
2. ✅ `routes/clerk.js` - NEW: Dedicated Clerk OAuth routes
3. ✅ `server.js` - Added ClerkExpressWithAuth middleware
4. ✅ `views/index.ejs` - Added Microsoft sign-in button
5. ✅ `views/register.ejs` - Fixed Microsoft sign-up button link
6. ✅ `routes/auth.js` - Removed duplicate callback handler

## Success Indicators

✅ Server starts without errors
✅ Can access login page with Microsoft button
✅ Clicking Microsoft button redirects to Clerk page
✅ Can sign in with @dlsud.edu.ph account
✅ Gets redirected back to your app
✅ Either logs in (existing) or shows registration form (new)

## Next Steps After Testing

1. **Add production URL** to Clerk dashboard redirect URLs
2. **Configure SMTP** for email verification
3. **Test full registration flow** with new Microsoft users
4. **Train admins** on approving Microsoft OAuth users
5. **Add error handling** for edge cases

---

## Quick Start Checklist

- [ ] Run `node server.js`
- [ ] Go to http://localhost:8080
- [ ] Click "Continue with Microsoft"
- [ ] Verify it redirects to Clerk
- [ ] Sign in with @dlsud.edu.ph account
- [ ] Check if callback works and redirects properly
- [ ] Test registration flow
- [ ] Check server console for any errors

If you see any errors, check:
1. Clerk API keys are correct in `.env`
2. Azure redirect URI matches Clerk's
3. Microsoft OAuth is enabled in Clerk dashboard
