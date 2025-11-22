# 🪣 FIX STORAGE BUCKET POLICIES

## ❌ Error: "new row violates row-level security policy"

Even with service role key, Storage buckets can have RLS policies that block uploads.

---

## ✅ SOLUTION: Configure Storage Bucket Policies

### Step 1: Go to Storage Policies
1. Open Supabase Dashboard
2. Go to **Storage** → **profiles** bucket
3. Click **Policies** tab

### Step 2: Check Existing Policies
- If there are policies, they might be blocking uploads
- Service role should bypass these, but let's make sure

### Step 3: Create/Update Upload Policy (Optional)
If you want to allow authenticated users to upload (in addition to service role):

**Policy Name:** "Allow authenticated uploads"
- **Allowed operation:** INSERT
- **Target roles:** authenticated
- **USING expression:** `true`
- **WITH CHECK expression:** `true`

**Policy Name:** "Allow authenticated updates"
- **Allowed operation:** UPDATE
- **Target roles:** authenticated
- **USING expression:** `true`
- **WITH CHECK expression:** `true`

---

## 🔧 ALTERNATIVE: Disable Storage RLS (Not Recommended)

If policies are causing issues, you can temporarily disable RLS on the bucket:
1. Go to Storage → profiles bucket
2. Click **Settings**
3. Toggle **"Public bucket"** to ON
4. This makes the bucket public (no RLS)

**Note:** Service role should bypass RLS anyway, so this might not be necessary.

---

## ✅ VERIFY SERVICE ROLE IS WORKING

### Check Terminal Logs:
When uploading, you should see:
```
[createSupabaseServerClient] Using SERVICE ROLE key
[upload/profile-picture] ✅ Using service role client for storage upload
```

If you DON'T see these, the service role key might not be loaded.

### Restart Dev Server:
```bash
# Stop server (Ctrl+C)
pnpm dev  # Restart
```

---

## 🧪 TEST

1. Restart dev server (to load env variables)
2. Try uploading profile picture
3. Check terminal logs for service role confirmation
4. If still fails, check Storage bucket policies

---

**The service role key should bypass ALL RLS, so if it's set correctly and server is restarted, it should work!**

