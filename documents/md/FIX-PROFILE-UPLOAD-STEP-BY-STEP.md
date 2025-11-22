# 🔧 FIX PROFILE PICTURE UPLOAD - STEP BY STEP

## ✅ COMPLETE FIX GUIDE

---

## 📋 STEP 1: Create Storage Bucket Policy

### In Supabase Dashboard:

1. **Go to Storage → Policies tab** (you're already here!)
2. **Find "PROFILES" bucket** (should show "Public" tag)
3. **Click "New policy"** button
4. **Fill in the form:**

   **Policy Name:** `Allow authenticated uploads`
   
   **Allowed operation:** Select **INSERT**
   
   **Target roles:** Select **authenticated**
   
   **USING expression:**
   ```sql
   true
   ```
   
   **WITH CHECK expression:**
   ```sql
   true
   ```

5. **Click "Review"** then **"Save policy"**

6. **Create another policy for UPDATE:**
   
   **Policy Name:** `Allow authenticated updates`
   
   **Allowed operation:** Select **UPDATE**
   
   **Target roles:** Select **authenticated**
   
   **USING expression:**
   ```sql
   true
   ```
   
   **WITH CHECK expression:**
   ```sql
   true
   ```

7. **Click "Review"** then **"Save policy"**

---

## 📋 STEP 2: Verify Service Role Key

### Check `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **You already have this!** (I can see it in your file)

---

## 📋 STEP 3: Restart Dev Server

**IMPORTANT:** Environment variables only load on server start!

1. **Stop server:** Press `Ctrl+C` in terminal
2. **Restart:** Run `pnpm dev`
3. **Wait for:** "Ready" message

---

## 📋 STEP 4: Test Upload

1. **Go to profile page:** `http://localhost:3000/user/profile`
2. **Click camera icon** on profile picture
3. **Select an image** (JPG, PNG, or WebP, max 5MB)
4. **Check terminal logs** for:
   - `[createSupabaseServerClient] Using SERVICE ROLE key` ✅
   - `[upload/profile-picture] ✅ Using service role client` ✅
   - `[upload/profile-picture] ✅ File uploaded successfully` ✅
   - `[upload/profile-picture] ✅ Database updated successfully` ✅

---

## 🐛 IF STILL FAILS

### Check Terminal Logs:
Look for these error messages:

1. **"SUPABASE_SERVICE_ROLE_KEY is not set!"**
   - Solution: Restart dev server

2. **"Storage RLS error"**
   - Solution: Create Storage policies (Step 1)

3. **"Bucket not found"**
   - Solution: Create `profiles` bucket in Storage

4. **"Database update error"**
   - Solution: Check if `avatar_url` and `profile_picture` columns exist

---

## ✅ QUICK CHECKLIST

- [ ] Storage bucket `profiles` exists (Public)
- [ ] Storage policies created (INSERT and UPDATE)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] Dev server restarted after adding env variable
- [ ] Database columns `avatar_url` and `profile_picture` exist
- [ ] RLS UPDATE policy exists for `users` table

---

## 🎯 EXPECTED RESULT

After completing all steps:
- ✅ Image uploads to Storage
- ✅ Database updates with image URL
- ✅ Profile picture displays on profile page
- ✅ No RLS errors in terminal

---

**Follow these steps in order, and the upload should work!** 🚀

