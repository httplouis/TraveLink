# 🖼️ Supabase Storage Setup Guide

## Overview
Supabase Storage allows you to store images and files (profiles, signatures, maintenance photos, etc.)

---

## 📋 Step 1: Create Storage Buckets in Supabase

Go to your Supabase Dashboard → Storage → Create new buckets:

### Buckets to Create:

1. **`profiles`** - User profile pictures
   - Public: ✅ Yes
   - Max file size: 5MB
   - Allowed MIME types: `image/*`

2. **`signatures`** - Digital signatures  
   - Public: ✅ Yes  
   - Max file size: 2MB
   - Allowed MIME types: `image/png, image/jpeg`

3. **`maintenance`** - Vehicle maintenance photos
   - Public: ✅ Yes
   - Max file size: 10MB
   - Allowed MIME types: `image/*`

4. **`documents`** - Other documents (PDF, etc.)
   - Public: ✅ Yes
   - Max file size: 10MB
   - Allowed MIME types: `application/pdf, image/*`

---

## 🔐 Step 2: Set Storage Policies

For each bucket, add policies in Supabase Dashboard → Storage → Policies:

### Policy 1: Public Read Access
```sql
-- Allow anyone to read files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );  -- Change bucket_id for each bucket

-- Repeat for: signatures, maintenance, documents
```

### Policy 2: Authenticated Upload
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles'
  AND auth.role() = 'authenticated'
);

-- Repeat for: signatures, maintenance, documents
```

### Policy 3: Users can update their own files
```sql
-- Allow users to update/delete their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Repeat for: signatures, maintenance, documents
```

---

## 💻 Step 3: Use in Your Code

### Example 1: Upload Profile Picture

```tsx
import { uploadProfilePicture } from '@/lib/storage/supabase-storage';

async function handleProfileUpload(userId: string, file: File) {
  const { url, path, error } = await uploadProfilePicture(userId, file);
  
  if (error) {
    console.error('Upload failed:', error);
    return;
  }
  
  // Save URL to user profile in database
  console.log('Uploaded to:', url);
  // Update user record: UPDATE users SET avatar_url = url WHERE id = userId
}
```

### Example 2: Upload Signature

```tsx
import { uploadSignature } from '@/lib/storage/supabase-storage';

async function handleSignatureUpload(userId: string, file: File) {
  const { url, error } = await uploadSignature(userId, file);
  
  if (error) {
    alert('Failed to upload signature: ' + error);
    return;
  }
  
  // Save signature URL to database
  console.log('Signature URL:', url);
}
```

### Example 3: Upload Maintenance Photo

```tsx
import { uploadMaintenancePhoto } from '@/lib/storage/supabase-storage';

async function handleMaintenancePhoto(vehicleId: string, file: File) {
  const { url, error } = await uploadMaintenancePhoto(vehicleId, file);
  
  if (error) {
    alert('Upload failed: ' + error);
    return;
  }
  
  // Save to maintenance_records table
  console.log('Photo URL:', url);
}
```

### Example 4: Generic Upload

```tsx
import { uploadImage, STORAGE_BUCKETS } from '@/lib/storage/supabase-storage';

async function handleCustomUpload(file: File) {
  const { url, error } = await uploadImage(
    STORAGE_BUCKETS.DOCUMENTS,
    file,
    'custom/path/myfile.jpg'  // Optional custom path
  );
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('Uploaded:', url);
}
```

---

## 🎨 Step 4: Add to Your Forms

### Example: Profile Picture Upload Component

```tsx
'use client';

import { useState } from 'react';
import { uploadProfilePicture } from '@/lib/storage/supabase-storage';
import Image from 'next/image';

export function ProfilePictureUpload({ userId }: { userId: string }) {
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    setPreview(URL.createObjectURL(file));
    
    // Upload
    setUploading(true);
    const { url, error } = await uploadProfilePicture(userId, file);
    setUploading(false);

    if (error) {
      alert('Upload failed: ' + error);
      return;
    }

    // TODO: Save URL to database
    console.log('Uploaded to:', url);
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative w-32 h-32 rounded-full overflow-hidden">
          <Image src={preview} alt="Profile" fill className="object-cover" />
        </div>
      )}
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block"
      />
      
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  );
}
```

---

## 📊 Database Integration

After uploading, save the URL to your database:

### Add columns to tables:

```sql
-- Users table
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN signature_url TEXT;

-- Vehicles table (if you want to store maintenance photos)
ALTER TABLE vehicles ADD COLUMN maintenance_photos TEXT[];  -- Array of URLs

-- Or create a separate maintenance_records table
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id),
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Benefits

✅ **Automatic CDN** - Fast image delivery worldwide  
✅ **Image transformation** - Resize/optimize on-the-fly  
✅ **Secure** - Row-level security policies  
✅ **Free tier** - 1GB storage included  
✅ **Easy to use** - Simple API  

---

## 🚀 Next Steps

1. Create the 4 storage buckets in Supabase Dashboard
2. Set up policies for each bucket
3. Add avatar_url/signature_url columns to your tables
4. Use the helper functions in your forms
5. Test uploading an image!

---

## 📝 Notes

- Images are stored at: `https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[path]`
- Max file size: 5MB (can be increased in bucket settings)
- Supported formats: JPG, PNG, GIF, WEBP, SVG
- Files are automatically compressed for optimal performance
