# 🧪 Testing Email Links Locally (Before Deploying)

## Problem
When testing locally, email links will have `http://localhost:3000` which won't work when clicked from email on a different device.

## Solutions

### Option 1: Check Server Logs (Easiest)
When you send an invitation, the confirmation link is logged in the server console:

1. **Send invitation** from your app
2. **Check terminal/console** - you'll see:
   ```
   [POST /api/requesters/invite] 🔗 Generated confirmation link: http://localhost:3000/requesters/confirm/...
   ```
3. **Copy the link** from console
4. **Paste in browser** to test

### Option 2: Use ngrok (Test from Real Email)
Expose your localhost to the internet temporarily:

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or use npm: npm install -g ngrok
   ```

2. **Start your Next.js app:**
   ```bash
   pnpm dev
   ```

3. **In another terminal, expose port 3000:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Set environment variable:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

6. **Restart your dev server:**
   ```bash
   pnpm dev
   ```

7. **Now email links will use ngrok URL** - works from any device!

### Option 3: Manual Testing (No Email Needed)
Test the confirmation page directly:

1. **Create invitation** (check server logs for token)
2. **Manually navigate to:**
   ```
   http://localhost:3000/requesters/confirm/[TOKEN_FROM_LOGS]
   ```
3. **Test the confirmation flow**

### Option 4: Use Production URL for Testing
If you have a deployed version:

1. **Set environment variable:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

2. **Restart dev server**

3. **Email links will point to production** (but you can test locally)

## Recommended: Option 1 + Option 2

- **Option 1** for quick testing (copy link from logs)
- **Option 2** for full email testing (real email, real device)

## Quick Test Checklist

✅ Send invitation
✅ Check server logs for confirmation link
✅ Copy link and test in browser
✅ Verify token is found in database
✅ Test confirmation flow

## After Testing Locally

Once you deploy to Vercel:
- `VERCEL_URL` is automatically set
- Or set `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- Email links will work automatically! 🎉

