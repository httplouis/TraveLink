# ✅ ENABLE AZURE PROVIDER - Final Step!

## 🎯 Problem: Azure Enabled Toggle is OFF

Nakita ko sa screenshot mo:
- **"Azure enabled"** toggle = **OFF** (white switch) ❌
- Application (client) ID = ✅ Filled
- Secret Value = ✅ Filled
- Callback URL = ✅ Shown

---

## ✅ SOLUTION: Turn ON the Toggle

### Step 1: Enable Azure
1. **Click the "Azure enabled" toggle** (top of the panel)
2. **Switch it to ON** (should turn green/blue)
3. Toggle should change from white (OFF) to colored (ON)

### Step 2: Fill Optional Field (If Needed)
- **Azure Tenant URL** is optional, pero kung may Tenant ID ka:
  - Format: `https://login.microsoftonline.com/YOUR_TENANT_ID`
  - O just: `YOUR_TENANT_ID`

### Step 3: Save
1. **Scroll down** (if needed)
2. **Click "Save"** button
3. Wait for confirmation

### Step 4: Copy Callback URL
1. **Click "Copy"** button next to Callback URL
2. **Go to Azure Portal** → App registrations → Your app → Authentication
3. **Add this URL** to Redirect URIs:
   ```
   https://ysfwjlswuxggegkvbdzn.supabase.co/auth/v1/callback
   ```

---

## ✅ After Enabling:

1. **Restart dev server:**
   ```bash
   # Press Ctrl+C to stop
   pnpm dev
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Click "Sign in with Microsoft"**

4. **Should redirect to Microsoft login!** ✅

---

## 🎯 Checklist:

- [ ] "Azure enabled" toggle = **ON** (green/blue)
- [ ] Application (client) ID = Filled ✅
- [ ] Secret Value = Filled ✅
- [ ] Callback URL added in Azure Portal ✅
- [ ] Clicked "Save" in Supabase ✅
- [ ] Restarted dev server ✅

---

**Click mo yung "Azure enabled" toggle para i-ON!** 🚀

