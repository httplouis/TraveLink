# 🔑 CHECK SUPABASE_SERVICE_ROLE_KEY

## ❌ Error: "new row violates row-level security policy"

This error means the service role key might not be set or not working.

---

## ✅ STEP 1: Check if Service Role Key Exists

### In `.env.local` file:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If missing:**
1. Go to Supabase Dashboard
2. Click **Settings** → **API**
3. Find **"service_role"** key (NOT anon key!)
4. Copy it
5. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

---

## ✅ STEP 2: Restart Dev Server

**IMPORTANT:** After adding/changing `.env.local`:
```bash
# Stop server (Ctrl+C)
# Then restart:
pnpm dev
```

---

## ✅ STEP 3: Check Terminal Logs

When you try to upload, check terminal for:
- `[createSupabaseServerClient] Using SERVICE ROLE key` ✅
- `[upload/profile-picture] ✅ Using service role client` ✅
- `[upload/profile-picture] ❌ SUPABASE_SERVICE_ROLE_KEY is not set!` ❌

---

## 🔍 STEP 4: Verify in Supabase Dashboard

1. Go to **Storage** → **profiles** bucket
2. Click **Policies** tab
3. Check if there are any RLS policies blocking uploads
4. If needed, create a policy:
   - **Policy name:** "Allow authenticated uploads"
   - **Allowed operation:** INSERT
   - **Target roles:** authenticated
   - **USING expression:** `true`
   - **WITH CHECK expression:** `true`

---

## 🧪 TEST

1. Make sure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
2. Restart dev server
3. Try uploading profile picture
4. Check terminal logs for detailed error messages

---

**The service role key bypasses ALL RLS policies, so if it's set correctly, upload should work!**

