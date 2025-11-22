# 🪣 CREATE PROFILES STORAGE BUCKET

## ❌ Error: "Bucket not found"

The `profiles` storage bucket doesn't exist in Supabase Storage.

---

## ✅ SOLUTION: Create the Bucket

### Step 1: Go to Supabase Storage
1. Open your Supabase Dashboard
2. Click **"Storage"** in the left sidebar
3. You should see a list of buckets (or empty if none exist)

### Step 2: Create New Bucket
1. Click **"New bucket"** button (top right)
2. Fill in the details:
   - **Name:** `profiles`
   - **Public bucket:** ✅ **YES** (check this box - important!)
   - **File size limit:** Leave default or set to 5MB
   - **Allowed MIME types:** Leave empty (allows all image types)
3. Click **"Create bucket"**

### Step 3: Verify
- You should now see `profiles` in your bucket list
- Status should show as "Public"

---

## 🔒 IMPORTANT: Make it Public!

**Why?** Profile pictures need to be publicly accessible so they can be displayed in the app.

**How?** Make sure "Public bucket" is checked when creating the bucket.

---

## ✅ After Creating the Bucket

1. Go back to your profile page
2. Try uploading an image again
3. Should work now! 🎉

---

## 🐛 If Still Not Working

Check terminal logs for:
- `[upload/profile-picture] Upload error:` - Should show specific error
- Make sure bucket name is exactly `profiles` (lowercase, no spaces)

