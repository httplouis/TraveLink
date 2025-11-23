# 🔧 Fix Microsoft Teams Login on Vercel

## Problem
Microsoft Teams login works on localhost but fails on Vercel with 401 Unauthorized errors when accessing `/api/profile`.

## Root Causes

### 1. **Azure AD Redirect URI Missing** ⚠️ CRITICAL
Azure AD app registration likely only has `localhost:3000/api/auth/callback` configured, but **NOT** the Vercel domain.

### 2. **Cookie Domain/Path Issues**
Cookies might not be set correctly for the Vercel domain.

### 3. **Environment Variables**
`NEXT_PUBLIC_APP_URL` might not be set in Vercel.

---

## ✅ Fixes Applied

### 1. Cookie Handling Improvements
- ✅ Removed explicit `domain` setting (let browser use default same-origin)
- ✅ Ensured `secure: true` in production
- ✅ Set `sameSite: 'lax'` for production
- ✅ Added better logging for cookie debugging

### 2. Enhanced Error Logging
- ✅ Added environment detection logging
- ✅ Added cookie verification before redirect
- ✅ Added session cookie presence checks

---

## 🔧 Required Configuration Steps

### Step 1: Add Vercel Redirect URI in Azure AD

**In Azure Portal:**

1. Go to **Azure Portal** → **App registrations** → Your app
2. **Authentication** → **Platform configurations** → **Web**
3. **Add redirect URI:**
   ```
   https://travilink.vercel.app/api/auth/callback
   ```
   OR if using a custom domain:
   ```
   https://your-custom-domain.com/api/auth/callback
   ```
4. **Also add Supabase callback (if not already):**
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
   (Replace `YOUR_PROJECT` with your Supabase project reference)

5. **Click "Save"**

### Step 2: Set Environment Variables in Vercel

**In Vercel Dashboard:**

1. Go to your project → **Settings** → **Environment Variables**
2. **Add/Verify these variables:**

   ```
   NEXT_PUBLIC_APP_URL=https://travilink.vercel.app
   ```
   (Or your custom domain if using one)

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Redeploy** after adding environment variables

### Step 3: Verify Supabase Azure Provider Configuration

**In Supabase Dashboard:**

1. **Authentication** → **Providers** → **Azure**
2. **Verify these settings:**
   - ✅ Azure enabled: **ON**
   - ✅ Client ID: Your Azure app's Application (client) ID
   - ✅ Client Secret: Your Azure app's Client Secret
   - ✅ Tenant ID: Your Azure Directory (tenant) ID
3. **Click "Save"**

---

## 🧪 Testing After Fix

1. **Clear browser cookies** for the Vercel domain
2. **Go to:** `https://travilink.vercel.app/login`
3. **Click "Sign in with Microsoft"**
4. **Login with Microsoft Teams account**
5. **Check browser console** for:
   - ✅ No 401 errors
   - ✅ Successful redirect to dashboard
   - ✅ Session cookies present

---

## 🔍 Debugging

If login still fails, check:

### 1. Browser Console
Look for:
- Cookie errors
- 401 errors on `/api/profile`
- Redirect issues

### 2. Vercel Logs
Check **Vercel Dashboard** → **Deployments** → **Functions** → **View Function Logs**

Look for:
- `[auth/callback]` logs
- Cookie setting logs
- Session verification logs

### 3. Azure AD Logs
Check **Azure Portal** → **App registrations** → Your app → **Sign-in logs**

Look for:
- Failed authentication attempts
- Redirect URI mismatches

---

## 📝 Important Notes

1. **Redirect URI Must Match Exactly**
   - Azure AD is very strict about redirect URIs
   - Must include `https://` (not `http://`)
   - Must match exactly (no trailing slashes unless specified)

2. **Cookies and Same-Origin**
   - Cookies work best when domain matches exactly
   - Don't set explicit `domain` attribute (let browser handle it)
   - Use `sameSite: 'lax'` for OAuth flows

3. **Environment Variables**
   - `NEXT_PUBLIC_APP_URL` should be your production domain
   - Must be set in Vercel environment variables
   - Redeploy after changing environment variables

---

## ✅ Checklist

- [ ] Added Vercel redirect URI in Azure AD
- [ ] Added Supabase callback URI in Azure AD (if not already)
- [ ] Set `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- [ ] Verified Supabase Azure provider is enabled
- [ ] Redeployed to Vercel
- [ ] Tested login on Vercel
- [ ] Checked browser console for errors
- [ ] Checked Vercel function logs

---

## 🚀 After Fix

Once all steps are completed:
1. **Redeploy** to Vercel (or wait for automatic deployment)
2. **Test login** with Microsoft Teams account
3. **Verify** you can access `/api/profile` without 401 errors
4. **Confirm** you're redirected to the correct dashboard

---

**Last Updated:** After cookie handling fixes for Vercel production

