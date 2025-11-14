# ✅ COMPLETE STORAGE POLICY SETUP

## ❌ Problem: Storage RLS Error

The policy needs BOTH `USING` and `WITH CHECK` expressions for INSERT operations.

---

## ✅ SOLUTION: Complete Policy Setup

### For INSERT Policy (Upload Files):

**Policy Name:** `Allow authenticated uploads`

**Allowed operation:** INSERT ✅

**Target roles:** authenticated ✅

**USING expression:**
```sql
bucket_id = 'profiles'
```

**WITH CHECK expression:**
```sql
bucket_id = 'profiles'
```

**IMPORTANT:** You need BOTH expressions! Not just WITH CHECK.

---

## 📋 HOW TO ADD USING EXPRESSION

### In Supabase Policy Editor:

1. **Look for "USING expression" field** (above or below WITH CHECK)
2. **If you don't see it:**
   - Click "View templates" button
   - Or manually add the USING expression

3. **USING expression should be:**
   ```
   bucket_id = 'profiles'
   ```

4. **WITH CHECK expression (you already have this):**
   ```
   bucket_id = 'profiles'
   ```

---

## 🔧 ALTERNATIVE: Use Template

1. **Click "View templates"** button
2. **Select:** "Allow authenticated users to upload files"
3. **Modify:** Change bucket name to `'profiles'`
4. **Save**

---

## ✅ QUICK FIX: Complete Policy SQL

If the UI doesn't show USING field, you can create the policy via SQL:

```sql
-- Allow authenticated users to INSERT into profiles bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');
```

---

## 🧪 AFTER CREATING POLICY

1. **Restart dev server** (if you haven't already)
2. **Try uploading again**
3. **Check terminal logs** for success messages

---

**The key is having BOTH USING and WITH CHECK expressions!**

