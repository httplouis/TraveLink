# 🚀 Microsoft OAuth Login - Quick Start

## ✅ What's Done

1. ✅ **Login page** - Now has "Sign in with Microsoft" button (Teams-style)
2. ✅ **OAuth callback** - Auto-fetches name, department, position from Microsoft Graph
3. ✅ **Auto user creation** - Creates user in Supabase with default role `faculty`
4. ✅ **No User.Read.All needed** - Uses delegated flow (User.Read is enough!)

---

## 🔧 Setup (2 Steps Only!)

### Step 1: Configure Azure in Supabase Dashboard

1. **Supabase Dashboard** → Your project → **Authentication** → **Providers**
2. **Enable "Azure"**
3. **Fill in:**
   - **Client ID**: Your Azure app's Application (client) ID
   - **Client Secret**: Your Azure app's Client Secret
   - **Tenant ID**: Your Azure Directory (tenant) ID
4. **Save**

### Step 2: Add Redirect URI in Azure

1. **Azure Portal** → **App registrations** → Your app
2. **Authentication** → **Platform configurations** → **Web**
3. **Add redirect URI:**
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
   (Replace `YOUR_PROJECT` with your Supabase project reference)

---

## 🧪 Test It!

1. **Start server:**
   ```bash
   pnpm dev
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Click "Sign in with Microsoft"**

4. **Login with your email** (e.g., `your.email@mseuf.edu.ph`)

5. **Check terminal logs:**
   - Should see: `✅ Profile retrieved: { name, department, position }`
   - Should see: `✅ User created` or `✅ User profile updated`

6. **Check Supabase `users` table:**
   - New user should be created with name, department, position from Graph API
   - Default role: `faculty`

---

## 📊 What Gets Retrieved

From Microsoft Graph API (using User.Read delegated permission):
- ✅ **Name**: `displayName`
- ✅ **Department**: `department`
- ✅ **Position**: `jobTitle`
- ✅ **Email**: `mail` or `userPrincipalName`

---

## 🎯 Key Points

✅ **No User.Read.All needed** - Uses delegated flow (user signs in)
✅ **Auto profile sync** - Every login updates name, department, position
✅ **Institutional email only** - Only `@mseuf.edu.ph` emails allowed
✅ **Default role: faculty** - Super admin assigns other roles later
✅ **Teams-style login** - Same login as Microsoft Teams

---

## 🐛 If It Doesn't Work

### Problem: "Failed to connect to Microsoft"
- Check Supabase Azure provider settings
- Verify Client ID, Secret, Tenant ID are correct

### Problem: Profile not retrieved
- Check terminal logs for Graph API errors
- Verify `User.Read` permission is granted in Azure
- Access token might not be in session (check logs)

### Problem: User not created
- Check Supabase `users` table permissions
- Check terminal logs for errors

---

## 🎉 Ready!

**That's it!** Just configure Azure in Supabase dashboard and you're good to go! 🚀

