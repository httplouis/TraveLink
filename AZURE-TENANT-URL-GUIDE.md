# ✅ Azure Tenant URL - Optional Field

## 🎯 About Azure Tenant URL

**"Azure Tenant URL"** is **OPTIONAL** - you can leave it empty!

But if you want to be specific, you can fill it.

---

## ✅ OPTION 1: Leave It Empty (Easiest)

**Just leave it empty!** 
- Supabase will use the **common tenant** by default
- Works for most cases
- **Recommended if you're not sure**

---

## ✅ OPTION 2: Fill It (If You Have Tenant ID)

If you have your **Tenant ID** from Azure Portal:

### Step 1: Get Tenant ID from Azure Portal
1. **Azure Portal** → **App registrations** → Your app ("TraviLink Email Directory")
2. **Overview** page
3. **Copy "Directory (tenant) ID"** (36-character UUID)

### Step 2: Fill in Supabase
You can use **either format**:

**Format 1 (Full URL):**
```
https://login.microsoftonline.com/YOUR_TENANT_ID
```

**Format 2 (Just Tenant ID):**
```
YOUR_TENANT_ID
```

**Example:**
- If Tenant ID is: `12345678-1234-1234-1234-123456789012`
- You can use:
  - `https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012`
  - OR just: `12345678-1234-1234-1234-123456789012`

---

## 🎯 RECOMMENDED: Leave It Empty

**For now, just:**
1. **Leave "Azure Tenant URL" empty** ✅
2. **Turn ON "Azure enabled" toggle** ✅
3. **Click "Save"** ✅

You can always add it later if needed!

---

## ✅ Final Steps:

1. **Azure Tenant URL** - Leave empty (or fill if you have Tenant ID)
2. **Turn ON "Azure enabled" toggle** (white → green/blue)
3. **Click "Save"**
4. **Restart dev server:**
   ```bash
   pnpm dev
   ```
5. **Test login:** `http://localhost:3000/login`

---

**TL;DR: Leave it empty, just turn ON the "Azure enabled" toggle!** 🚀

