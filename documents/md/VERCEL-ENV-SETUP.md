# 🔧 Vercel Environment Variables Setup

## ⚠️ CRITICAL: Email Links on Mobile Devices

**Problem:** Email invitation links don't work on mobile devices if `NEXT_PUBLIC_APP_URL` is not set in Vercel.

**Solution:** Set the `NEXT_PUBLIC_APP_URL` environment variable in Vercel.

## 📋 How to Set Environment Variable in Vercel

### Step 1: Go to Vercel Dashboard
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **TraviLink** project

### Step 2: Navigate to Settings
1. Click **Settings** tab
2. Click **Environment Variables** in the left sidebar

### Step 3: Add Environment Variable
1. Click **Add New**
2. Enter:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://travilink.vercel.app` (or your custom domain)
   - **Environment:** Select **Production**, **Preview**, and **Development** (or just **Production** if you only want it in production)
3. Click **Save**

### Step 4: Redeploy
After adding the environment variable, you need to redeploy:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**

Or simply push a new commit to trigger automatic deployment.

## ✅ Verification

After setting up, check the logs when sending an invitation:
- Look for: `[getBaseUrl] ✅ Using NEXT_PUBLIC_APP_URL: https://travilink.vercel.app`
- If you see: `[getBaseUrl] ⚠️ WARNING: Using localhost in production!` → The environment variable is NOT set correctly

## 🔍 Priority Order

The system uses this priority order to determine the base URL:

1. **NEXT_PUBLIC_APP_URL** (explicit - BEST for production) ✅
2. Request headers (works for current request)
3. VERCEL_URL (auto-set by Vercel)
4. localhost (development only - NEVER in production) ❌

## 📱 Mobile Compatibility

Once `NEXT_PUBLIC_APP_URL` is set:
- ✅ Email links will work on mobile devices
- ✅ Users can sign/confirm from their phones
- ✅ Links will always point to production URL (not localhost)

## 🚨 Common Issues

### Issue: "No server found" on mobile
**Cause:** `NEXT_PUBLIC_APP_URL` not set, using localhost
**Fix:** Set `NEXT_PUBLIC_APP_URL` in Vercel and redeploy

### Issue: Links work on web but not mobile
**Cause:** Using request headers instead of explicit URL
**Fix:** Set `NEXT_PUBLIC_APP_URL` in Vercel

### Issue: Links point to wrong domain
**Cause:** `NEXT_PUBLIC_APP_URL` set to wrong value
**Fix:** Update `NEXT_PUBLIC_APP_URL` to correct domain in Vercel

