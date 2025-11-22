# 🚨 URGENT: Enable Azure Provider in Supabase

## ❌ Current Error

```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

**This means:** Azure provider is **NOT enabled** in Supabase Dashboard.

---

## ✅ FIX: Enable Azure Provider (5 Minutes)

### Step 1: Open Supabase Dashboard

1. **Go to:** https://supabase.com/dashboard
2. **Login** to your account
3. **Click** on your **TraviLink project**

### Step 2: Go to Authentication → Providers

1. **Left sidebar** → Click **"Authentication"**
2. **Top tabs** → Click **"Providers"**
3. **Scroll down** → Find **"Azure"** (it's in alphabetical order, near the top)

### Step 3: Enable Azure Provider

1. **Find the "Azure" card/section**
2. **Toggle the switch** to **ON** (should turn blue/green)
3. **Three fields will appear:**
   - Client ID (Application ID)
   - Client Secret
   - Tenant ID

### Step 4: Fill in Azure Credentials

**You need these from Azure Portal:**

#### A. Get Client ID:
1. **Azure Portal** → **App registrations** → Your app
2. **Overview** page
3. **Copy:** "Application (client) ID"
4. **Paste** into Supabase "Client ID" field

#### B. Get Tenant ID:
1. **Same page** (Overview)
2. **Copy:** "Directory (tenant) ID"
3. **Paste** into Supabase "Tenant ID" field

#### C. Get Client Secret:
1. **Azure Portal** → **App registrations** → Your app
2. **Left sidebar** → Click **"Certificates & secrets"**
3. **Client secrets** tab
4. **If no secret exists:**
   - Click **"New client secret"**
   - Description: "TraviLink OAuth"
   - Expires: Choose duration (6 months, 12 months, etc.)
   - Click **"Add"**
   - **⚠️ COPY THE VALUE IMMEDIATELY** (you can't see it again!)
5. **Copy the "Value"** (not Secret ID!)
6. **Paste** into Supabase "Client Secret" field

### Step 5: Save in Supabase

1. **Click "Save"** button at the bottom
2. **Wait for confirmation** (should show "Provider enabled" or similar)

### Step 6: Add Redirect URI in Azure

1. **Azure Portal** → **App registrations** → Your app
2. **Authentication** → **Platform configurations** → **Web**
3. **Redirect URIs** section
4. **Click "Add URI"** or edit existing
5. **Add:**
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
   - **Find YOUR_PROJECT:**
     - Supabase Dashboard → **Settings** (gear icon) → **API**
     - Look at "Project URL"
     - Example: `https://abcdefghijklmnop.supabase.co`
     - Use: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
6. **Click "Save"**

---

## 🧪 Test After Enabling

1. **Restart dev server:**
   ```bash
   # Press Ctrl+C to stop
   # Then:
   pnpm dev
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Click "Sign in with Microsoft"**

4. **Should redirect to Microsoft login** (no more error!)

---

## ✅ Verification Checklist

Before testing, make sure:
- [ ] Azure provider toggle is **ON** (blue/green) in Supabase
- [ ] Client ID is filled (36-character UUID)
- [ ] Client Secret is filled (long string)
- [ ] Tenant ID is filled (36-character UUID)
- [ ] Redirect URI added in Azure Portal
- [ ] Dev server restarted

---

## 🐛 Still Not Working?

### Check 1: Supabase Dashboard
- Go to: Authentication → Providers
- Is Azure toggle **ON**? (should be blue/green, not gray)
- Are all 3 fields filled? (no empty fields)

### Check 2: Azure Portal
- Go to: App registrations → Your app → Authentication
- Is redirect URI added? (should match exactly)
- Is Client Secret still valid? (not expired)

### Check 3: Terminal
- Restart dev server after enabling
- Check for any new errors

---

## 📸 Visual Guide

**Supabase Dashboard:**
```
Authentication (left sidebar)
  → Providers (top tab)
    → Scroll to "Azure"
      → Toggle ON
      → Fill Client ID, Secret, Tenant ID
      → Click Save
```

**Azure Portal:**
```
App registrations
  → Your app
    → Overview → Copy Client ID & Tenant ID
    → Certificates & secrets → Copy/Create Client Secret
    → Authentication → Add redirect URI
```

---

## 🎯 After Enabling

✅ Error will disappear  
✅ "Sign in with Microsoft" will work  
✅ Will redirect to Microsoft login  
✅ After login, user will be created with `faculty` role  
✅ Profile will sync from Graph API (name, department, position)  

---

**Enable it now in Supabase Dashboard, then try again!** 🚀

