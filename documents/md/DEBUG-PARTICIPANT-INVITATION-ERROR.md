# 🔍 Debug Participant Invitation 500 Error

## Problem
Getting 500 error when trying to send invitation to `a22-34976@student.mseuf.edu.ph`

## ✅ Student Emails Should Work!

**No restriction on student emails** - `@student.mseuf.edu.ph` emails are fully supported!

---

## 🔍 Step 1: Check Terminal Logs

**After you try to send the invitation, check your terminal** (where `pnpm dev` is running).

**Look for these logs:**
```
[POST /api/participants/invite] 🚀 API Route Called!
[POST /api/participants/invite] 📥 Request body: { request_id: '...', email: '...' }
[POST /api/participants/invite] 📝 Creating invitation with: { ... }
[POST /api/participants/invite] ❌ Database Error: ...
```

**Copy the error message** and share it here so we can fix it!

---

## 🔍 Step 2: Common Issues & Fixes

### Issue 1: Database Table Doesn't Exist

**Error:** `relation "participant_invitations" does not exist`

**Fix:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL script: `CREATE-PARTICIPANT-INVITATION-SYSTEM.sql`
3. Verify table exists: `SELECT * FROM participant_invitations LIMIT 1;`

### Issue 2: Foreign Key Constraint

**Error:** `foreign key constraint` or `violates foreign key constraint`

**Possible causes:**
- `request_id` doesn't exist in `requests` table
- `invited_by` user doesn't exist in `users` table

**Fix:**
- Make sure the request is saved first (as draft or submitted)
- Make sure you're logged in with a valid user account

### Issue 3: Missing Required Fields

**Error:** `null value in column` or `violates not-null constraint`

**Fix:**
- Check if all required fields are being sent:
  - `request_id` ✅
  - `email` ✅
  - `invited_by` ✅
  - `token` ✅
  - `expires_at` ✅
  - `status` ✅

### Issue 4: Unique Constraint Violation

**Error:** `duplicate key value violates unique constraint`

**Possible causes:**
- Token already exists (very rare)
- Email + request_id combination already exists

**Fix:**
- The code should handle this - it will resend the invitation if it already exists

---

## 🔍 Step 3: Check Database Schema

### Verify Table Exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'participant_invitations';
```

### Check Table Structure:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'participant_invitations'
ORDER BY ordinal_position;
```

### Check if Request Exists:
```sql
SELECT id, request_number, status
FROM requests
WHERE id = 'YOUR_REQUEST_ID_HERE';
```

---

## 🔍 Step 4: Test API Directly

**Open browser console** and run:
```javascript
fetch('/api/participants/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request_id: 'YOUR_REQUEST_ID',
    email: 'a22-34976@student.mseuf.edu.ph'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Check the response** - it will show the exact error!

---

## ✅ Quick Checklist

- [ ] Database table `participant_invitations` exists
- [ ] Request is saved (has a `request_id`)
- [ ] You're logged in (have a valid user account)
- [ ] Check terminal logs for actual error
- [ ] Try sending invitation again
- [ ] Check browser console for error details

---

## 🎯 Most Likely Issue

**Based on the 500 error, it's probably:**
1. **Database table doesn't exist** - Run the SQL script
2. **Foreign key constraint** - Request or user doesn't exist
3. **Missing field** - Some required field is null

**Check the terminal logs** - the new error logging will show exactly what's wrong!

---

## 📝 Next Steps

1. **Try sending invitation again**
2. **Check terminal logs** (where `pnpm dev` is running)
3. **Copy the error message** from terminal
4. **Share it here** so we can fix it!

The new error logging will show:
- ✅ What data is being sent
- ✅ Database error details
- ✅ Error code and hints
- ✅ Full error stack

**This will help us identify the exact problem!** 🚀

