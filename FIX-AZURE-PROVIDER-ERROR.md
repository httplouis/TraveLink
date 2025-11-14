# 🔧 Fix: "Unsupported provider: provider is not enabled"

## ❌ Error You're Getting

```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

**Meaning:** Azure OAuth provider is **not enabled** in your Supabase project.

---

## ✅ Solution: Enable Azure Provider in Supabase

### Step 1: Go to Supabase Dashboard

1. **Open:** https://supabase.com/dashboard
2. **Login** to your account
3. **Select** your TraviLink project

### Step 2: Navigate to Authentication → Providers

1. **Click** "Authentication" in the left sidebar
2. **Click** "Providers" tab (should be at the top)
3. **Scroll down** to find "Azure" provider

### Step 3: Enable and Configure Azure

1. **Toggle** the switch to **enable** "Azure" (should turn green/blue)

2. **Fill in the required fields:**

   **a. Client ID (Application ID):**
   - Go to: Azure Portal → App registrations → Your app
   - Copy: **Application (client) ID**
   - Paste into Supabase "Client ID" field

   **b. Client Secret:**
   - Go to: Azure Portal → App registrations → Your app → **Certificates & secrets**
   - If you don't have one, click **"New client secret"**
   - Copy the **Value** (not the Secret ID!)
   - ⚠️ **Important:** Copy it immediately - you can't see it again!
   - Paste into Supabase "Client Secret" field

   **c. Tenant ID (Directory ID):**
   - Go to: Azure Portal → App registrations → Your app
   - Copy: **Directory (tenant) ID**
   - Paste into Supabase "Tenant ID" field

3. **Click "Save"** at the bottom

### Step 4: Add Redirect URI in Azure Portal

1. **Go to Azure Portal** → **App registrations** → Your app
2. **Click "Authentication"** → **Platform configurations** → **Web**
3. **Click "Add URI"** or edit existing
4. **Add redirect URI:**
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   - **Find your project reference:**
     - Supabase Dashboard → **Settings** → **API**
     - Look for "Project URL" (e.g., `https://abcdefghijklmnop.supabase.co`)
     - Use that reference in the redirect URI
   - **Example:** `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

5. **Click "Save"**

---

## 🧪 Test After Setup

1. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C) then:
   pnpm dev
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Click "Sign in with Microsoft"**

4. **Should redirect to Microsoft login** (not show error anymore!)

---

## 📝 Quick Checklist

- [ ] Azure provider **enabled** in Supabase Dashboard (toggle is ON)
- [ ] Client ID filled in (from Azure Portal)
- [ ] Client Secret filled in (from Azure Portal - create new one if needed)
- [ ] Tenant ID filled in (from Azure Portal)
- [ ] Redirect URI added in Azure Portal
- [ ] Dev server restarted

---

## 🎯 What Happens After Login

1. **Student emails** (`@student.mseuf.edu.ph`):
   - ✅ Can login
   - ✅ Default role: `faculty` (will see faculty view)
   - ✅ Super admin can change role later

2. **Faculty/Staff emails** (`@mseuf.edu.ph`):
   - ✅ Can login
   - ✅ Default role: `faculty`
   - ✅ Profile synced from Microsoft Graph (name, department, position)
   - ✅ Super admin can assign other roles (head, admin, etc.)

---

## 🐛 If Still Not Working

### Check Supabase Dashboard:
- Make sure Azure provider toggle is **ON** (green/blue, not gray)
- Verify all 3 fields are filled (no empty fields)
- Check for any red error messages
- Try disabling and re-enabling the provider

### Check Azure Portal:
- Verify redirect URI matches exactly (no typos)
- Check if Client Secret is expired (create new one if needed)
- Verify API permissions: `User.Read` (Delegated) is granted

### Check Terminal:
- Look for any Supabase errors
- Check if OAuth redirect URL is correct

---

## 💡 Pro Tips

1. **Client Secret expires** - If it expires, create a new one in Azure and update Supabase
2. **Redirect URI must match exactly** - Copy-paste to avoid typos
3. **Restart dev server** after changing Supabase settings

---

## ✅ Once Enabled

After enabling Azure provider:
- ✅ Error message will disappear
- ✅ "Sign in with Microsoft" button will work
- ✅ Will redirect to Microsoft login page
- ✅ After login, will auto-create user with `faculty` role
- ✅ Will retrieve name, department, position from Graph API

---

**Enable it now and try again!** 🚀

