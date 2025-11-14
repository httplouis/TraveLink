# 🔧 How to Enable Azure Provider in Supabase

## ❌ Error You're Seeing

```
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

**This means:** Azure OAuth provider is not enabled in your Supabase project.

---

## ✅ Solution: Enable Azure Provider

### Step 1: Go to Supabase Dashboard

1. **Open:** https://supabase.com/dashboard
2. **Select** your TraviLink project

### Step 2: Navigate to Authentication Settings

1. **Click** "Authentication" in the left sidebar
2. **Click** "Providers" tab
3. **Scroll down** to find "Azure" provider

### Step 3: Enable Azure Provider

1. **Toggle** the switch to enable "Azure"
2. **Fill in the required fields:**
   - **Client ID (Application ID)**: Your Azure app's Client ID
     - Get this from: Azure Portal → App registrations → Your app → Overview → Application (client) ID
   - **Client Secret**: Your Azure app's Client Secret
     - Get this from: Azure Portal → App registrations → Your app → Certificates & secrets → Client secrets
   - **Tenant ID (Directory ID)**: Your Azure Directory (tenant) ID
     - Get this from: Azure Portal → App registrations → Your app → Overview → Directory (tenant) ID

3. **Click "Save"**

### Step 4: Configure Redirect URI in Azure

1. **Go to Azure Portal** → **App registrations** → Your app
2. **Click "Authentication"** → **Platform configurations** → **Web**
3. **Add redirect URI:**
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   - Replace `YOUR_PROJECT_REF` with your Supabase project reference
   - Find it in: Supabase Dashboard → Settings → API → Project URL
   - Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

4. **Click "Save"**

---

## 🧪 Test After Enabling

1. **Restart your dev server:**
   ```bash
   # Stop (Ctrl+C) then:
   pnpm dev
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Click "Sign in with Microsoft"**

4. **Should redirect to Microsoft login** (not show error)

---

## 📝 Quick Checklist

- [ ] Azure provider enabled in Supabase Dashboard
- [ ] Client ID filled in
- [ ] Client Secret filled in
- [ ] Tenant ID filled in
- [ ] Redirect URI added in Azure Portal
- [ ] Dev server restarted

---

## 🐛 If Still Not Working

### Check Supabase Dashboard:
- Make sure Azure provider toggle is **ON** (green)
- Verify all fields are filled (no empty fields)
- Check for any error messages in Supabase dashboard

### Check Azure Portal:
- Verify redirect URI matches exactly
- Check if Client Secret is expired (create new one if needed)
- Verify API permissions are granted

### Check Terminal Logs:
- Look for any Supabase errors
- Check if OAuth redirect is working

---

## 💡 Pro Tip

**For local development**, you might also need to add:
```
http://localhost:3000/api/auth/callback
```

But Supabase usually handles the redirect automatically, so the main redirect URI should be:
```
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

---

**Once enabled, try logging in again!** 🚀

