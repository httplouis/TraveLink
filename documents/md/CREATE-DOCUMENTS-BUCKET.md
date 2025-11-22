# 🪣 CREATE DOCUMENTS STORAGE BUCKET

## ❌ Error: "Bucket not found"

The `documents` storage bucket doesn't exist in Supabase Storage.

---

## ✅ SOLUTION: Create the Bucket

### Step 1: Go to Supabase Storage
1. Open your Supabase Dashboard
2. Click **"Storage"** in the left sidebar
3. You should see a list of buckets (or empty if none exist)

### Step 2: Create New Bucket
1. Click **"New bucket"** button (top right)
2. Fill in the details:
   - **Name:** `documents` (exactly this, lowercase)
   - **Public bucket:** ✅ **YES** (check this box - important!)
   - **File size limit:** 10MB (or 10485760 bytes)
   - **Allowed MIME types:** 
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
3. Click **"Create bucket"**

### Step 3: Verify
- You should now see `documents` in your bucket list
- Status should show as "Public"

---

## 🔒 IMPORTANT: Make it Public!

**Why?** Request attachments need to be publicly accessible so they can be downloaded and viewed.

**How?** Make sure "Public bucket" is checked when creating the bucket.

---

## 🔐 Step 4: Set Up Storage Policies

After creating the bucket, you need to set up policies so users can upload files.

### Option A: Use SQL File (Recommended)
1. Open Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `CREATE-DOCUMENTS-BUCKET-AND-POLICIES.sql`
3. Click "Run" to execute

### Option B: Manual Setup via Dashboard
1. Go to Supabase Dashboard > Storage > documents > Policies
2. Click "New Policy"
3. Create these policies:

**Policy 1: Allow authenticated uploads**
- Policy name: `Allow authenticated uploads to documents`
- Allowed operation: INSERT
- Target roles: authenticated
- WITH CHECK expression: `bucket_id = 'documents'`

**Policy 2: Allow public read access**
- Policy name: `Allow public read access to documents`
- Allowed operation: SELECT
- Target roles: public
- USING expression: `bucket_id = 'documents'`

**Policy 3: Allow authenticated updates**
- Policy name: `Allow authenticated updates to documents`
- Allowed operation: UPDATE
- Target roles: authenticated
- USING expression: `bucket_id = 'documents'`
- WITH CHECK expression: `bucket_id = 'documents'`

**Policy 4: Allow authenticated deletes**
- Policy name: `Allow authenticated deletes to documents`
- Allowed operation: DELETE
- Target roles: authenticated
- USING expression: `bucket_id = 'documents'`

---

## ✅ After Creating the Bucket and Policies

1. Go back to your request form
2. Try uploading an attachment again
3. Should work now! 🎉

---

## 🐛 If Still Not Working

Check terminal logs for:
- `[UploadAttachment] ❌ Storage upload error:` - Should show specific error
- Make sure bucket name is exactly `documents` (lowercase, no spaces)
- Verify policies are created correctly
- Check that the bucket is set to "Public"

---

## 📝 Quick Checklist

- [ ] Bucket `documents` exists in Supabase Storage
- [ ] Bucket is set to "Public"
- [ ] File size limit is set to 10MB
- [ ] Allowed MIME types include: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`
- [ ] Storage policies are created (4 policies total)
- [ ] Try uploading an attachment again

