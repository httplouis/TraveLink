# Fix "Profile Not Found" Error

## 🚨 What's Happening

You're seeing "Profile not found" when trying to submit a request. This means the API can't fetch your user profile from the database.

---

## ✅ SOLUTION - Run These SQL Files IN ORDER

### **Step 1: Run ADD-REQUESTER-NAME-COLUMN.sql**

```sql
-- ADD-REQUESTER-NAME-COLUMN.sql
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255);

-- Update existing requests
UPDATE public.requests r
SET requester_name = u.name
FROM public.users u
WHERE r.requester_id = u.id
  AND r.requester_name IS NULL;
```

### **Step 2: Run ADD-PARENT-HEAD-SUPPORT.sql**

```sql
-- ADD-PARENT-HEAD-SUPPORT.sql
-- (Run the whole file - it adds parent_department_id columns)
```

### **Step 3: Diagnose Your Profile**

Run this in Supabase SQL Editor:

```sql
-- Check your profile
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_id,
  pu.name,
  pu.department_id,
  pu.is_head,
  d.code as dept_code,
  d.name as dept_name
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_user_id = au.id
LEFT JOIN public.departments d ON pu.department_id = d.id
WHERE au.email = 'faculty.cnahs@mseuf.edu.ph';  -- YOUR EMAIL HERE
```

**Expected Result:**
```
auth_id | auth_email              | public_id | name | department_id | dept_code | dept_name
abc123  | faculty.cnahs@...       | def456    | Jose | xyz789        | CNAHS     | College of Nursing...
```

**If any field is NULL, continue to Step 4!**

---

### **Step 4: Fix Missing Data**

#### **If `public_id` is NULL** (no public.users entry):

```sql
-- Get your auth_user_id first
SELECT id FROM auth.users WHERE email = 'faculty.cnahs@mseuf.edu.ph';
-- Copy the ID, then:

INSERT INTO public.users (auth_user_id, email, name, role, department_id, is_head)
VALUES (
  'PASTE_AUTH_ID_HERE',
  'faculty.cnahs@mseuf.edu.ph',
  'Jose Louis Rosales',
  'faculty',
  (SELECT id FROM public.departments WHERE code = 'CNAHS'),
  false
);
```

#### **If `department_id` is NULL**:

```sql
UPDATE public.users 
SET department_id = (SELECT id FROM public.departments WHERE code = 'CNAHS')
WHERE email = 'faculty.cnahs@mseuf.edu.ph';
```

#### **If `name` is NULL**:

```sql
UPDATE public.users 
SET name = 'Jose Louis Rosales'
WHERE email = 'faculty.cnahs@mseuf.edu.ph';
```

---

## 🔧 What I Changed in the Code

I made the API more robust:

1. **Tries with department join first**
2. **If that fails, fetches without join**
3. **Then manually fetches department**
4. **Better error messages**

So even if the join fails, it should still work!

---

## 🧪 Test After Fixing

### **Step 1: Restart Dev Server**
```bash
# Stop (Ctrl+C) then:
pnpm dev
```

### **Step 2: Clear Browser Cache**
```
Ctrl + Shift + R (Hard refresh)
Or close browser completely and reopen
```

### **Step 3: Login Again**
```
Email: faculty.cnahs@mseuf.edu.ph
Password: Faculty@123
```

### **Step 4: Submit Request**
1. Go to `/user/request`
2. Fill the form
3. Sign
4. Click "Send to Department Head"
5. ✅ Should work now!

---

## 🔍 Still Not Working?

### **Check Console Logs**

In your terminal where `pnpm dev` is running, look for:

```
[/api/requests/submit] Profile fetch error: ...
```

This will tell us exactly what's wrong!

### **Run Diagnostic SQL**

Open `DIAGNOSE-PROFILE-ISSUE.sql` and run each query in Supabase SQL Editor.

Share the results with me if still having issues!

---

## 📝 Summary of Required SQL Files

Run these **IN ORDER** in Supabase SQL Editor:

1. ✅ `ADD-REQUESTER-NAME-COLUMN.sql` - Adds missing column
2. ✅ `FIX-REQUEST-NUMBER-RACE-CONDITION.sql` - Fixes duplicate numbers
3. ✅ `ADD-PARENT-HEAD-SUPPORT.sql` - Adds office hierarchy support

Then restart dev server and try again!

---

## 🎯 Quick Fix (If Urgent)

If you just want to test quickly without office hierarchy:

```sql
-- Minimal fix - just add the requester_name column
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255);

-- Verify your profile exists
SELECT * FROM public.users WHERE email = 'faculty.cnahs@mseuf.edu.ph';

-- If no results, create it:
INSERT INTO public.users (
  auth_user_id, 
  email, 
  name, 
  role, 
  department_id
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'faculty.cnahs@mseuf.edu.ph'),
  'faculty.cnahs@mseuf.edu.ph',
  'Jose Louis Rosales',
  'faculty',
  (SELECT id FROM public.departments WHERE code = 'CNAHS')
);
```

Then restart and test!

---

**Priority: Run SQL fixes → Restart → Test!** 🚀
