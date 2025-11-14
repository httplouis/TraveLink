# 🔐 Microsoft OAuth Login Setup Guide

## ✅ What Was Changed

### 1. **Login Page** - Now uses Microsoft OAuth only
- ❌ Removed: Email/password form
- ✅ Added: "Sign in with Microsoft" button
- Uses Supabase OAuth with Azure provider

### 2. **OAuth Callback Handler** (`/api/auth/callback`)
- Exchanges OAuth code for session
- Fetches user profile from Microsoft Graph API (using User.Read delegated permission)
- Auto-creates/updates user in Supabase `users` table
- Retrieves: name, department, position from Graph API
- Default role: `faculty` (super admin assigns other roles later)

### 3. **Registration Page** - Can be hidden/removed
- No longer needed since users login via Microsoft OAuth

---

## 🔧 Setup Steps

### Step 1: Configure Azure AD App in Supabase

1. **Go to Supabase Dashboard** → Your project
2. **Authentication** → **Providers**
3. **Enable "Azure" provider**
4. **Configure Azure settings:**
   - **Client ID (Application ID)**: Your Azure app's Client ID
   - **Client Secret**: Your Azure app's Client Secret
   - **Tenant ID**: Your Azure Directory (tenant) ID
   - **Redirect URL**: `https://your-project.supabase.co/auth/v1/callback`
     - Or for local dev: `http://localhost:3000/api/auth/callback`

### Step 2: Azure App Configuration

**In Azure Portal:**

1. **App registrations** → Your app
2. **Authentication** → **Platform configurations**
3. **Add platform** → **Web**
4. **Redirect URIs:**
   - Production: `https://your-project.supabase.co/auth/v1/callback`
   - Local dev: `http://localhost:3000/api/auth/callback`
5. **API permissions:**
   - ✅ `User.Read` (Delegated) - Already have this!
   - ✅ `email`, `openid`, `profile` (Delegated) - Already have this!
   - **No need for `User.Read.All`** - We're using delegated flow!

### Step 3: Test Login

1. **Start dev server:**
   ```bash
   pnpm dev
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Click "Sign in with Microsoft"**

4. **Login with your institutional email** (e.g., `your.email@mseuf.edu.ph`)

5. **After login:**
   - Check terminal logs for `[auth/callback]` messages
   - Should see: `✅ Profile retrieved: { name, department, position }`
   - Should see: `✅ User created` or `✅ User profile updated`

---

## 📊 How It Works

### Login Flow:

1. **User clicks "Sign in with Microsoft"**
   - Redirects to Microsoft login page
   - User enters email + password (same as Teams)

2. **Microsoft authenticates user**
   - Returns OAuth code

3. **Callback handler** (`/api/auth/callback`):
   - Exchanges code for Supabase session
   - Gets access token from session
   - Calls Microsoft Graph API: `GET /v1.0/me`
   - Retrieves: `displayName`, `department`, `jobTitle`
   - Creates/updates user in Supabase `users` table
   - Redirects to appropriate dashboard

### Data Retrieved from Graph API:

- ✅ **Name**: `displayName`
- ✅ **Department**: `department`
- ✅ **Position**: `jobTitle`
- ✅ **Email**: `mail` or `userPrincipalName`

### Default User Creation:

- **Role**: `faculty` (default)
- **Status**: `active`
- **Super admin** assigns other roles (head, admin, etc.) later

---

## 🎯 Key Features

### ✅ No User.Read.All Needed!
- Uses **delegated flow** (user signs in)
- Only needs `User.Read` (Delegated) permission
- Reads user's **own profile** (not other users)

### ✅ Auto Profile Sync
- On every login, profile is synced from Microsoft Graph
- Name, department, position are updated automatically

### ✅ Institutional Email Only
- Only allows `@mseuf.edu.ph` and `@student.mseuf.edu.ph` emails
- Other emails are rejected

### ✅ Role Assignment
- Default role: `faculty`
- Super admin assigns other roles via admin panel
- Roles: `head`, `admin`, `hr`, `vp`, `president`, `comptroller`, etc.

---

## 🐛 Troubleshooting

### Problem: "Failed to connect to Microsoft"
**Solution:**
- Check Supabase Azure provider configuration
- Verify Client ID, Client Secret, Tenant ID are correct
- Check redirect URLs match

### Problem: "Invalid email" error
**Solution:**
- Make sure you're using institutional email (`@mseuf.edu.ph`)
- Check callback handler email validation

### Problem: Profile not retrieved
**Solution:**
- Check terminal logs for Graph API errors
- Verify `User.Read` permission is granted
- Check if access token is present in session

### Problem: User not created
**Solution:**
- Check Supabase `users` table permissions
- Check terminal logs for insert errors
- Verify database schema is correct

---

## 📝 Environment Variables

**No new env variables needed!** 

Supabase handles Azure OAuth configuration through the dashboard.

---

## 🎉 Summary

✅ **Microsoft OAuth login** - Teams-style authentication
✅ **Auto profile sync** - Name, department, position from Graph API
✅ **No User.Read.All needed** - Uses delegated flow
✅ **Institutional email only** - Security enforced
✅ **Super admin role assignment** - Flexible role management

**Ready to test!** 🚀

