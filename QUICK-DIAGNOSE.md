# 🔍 Quick Diagnose - Why Login Not Working

## Your Error:
```
GET /api/me 401 in 725ms
```

**Meaning:** User not authenticated or not found in database.

---

## ✅ STEP-BY-STEP FIX:

### Step 1: Verify Users Exist

**Run this in Supabase SQL Editor:**
```sql
\i verify-users.sql
```

This will show you:
1. ✅ Users in Supabase Auth?
2. ✅ Users in public.users table?
3. ✅ Role grants assigned?
4. ✅ Departments exist?

---

## 🎯 COMMON PROBLEMS & FIXES:

### Problem 1: "0 rows" in auth.users
**Meaning:** Users not created yet!

**FIX:**
1. Go to Supabase Dashboard
2. Authentication → Users
3. Click "Add User" button
4. Create these 6 users:

```
Email: faculty@mseuf.edu.ph
Password: Test@123
✅ Auto Confirm User

Email: head.nursing@mseuf.edu.ph
Password: Test@123
✅ Auto Confirm User

Email: hr.admin@mseuf.edu.ph
Password: Test@123
✅ Auto Confirm User

Email: comptroller@mseuf.edu.ph
Password: Test@123
✅ Auto Confirm User

Email: exec.president@mseuf.edu.ph
Password: Test@123
✅ Auto Confirm User

Email: admin@mseuf.edu.ph
Password: Admin@123
✅ Auto Confirm User
```

---

### Problem 2: Auth users exist, but "0 rows" in public.users
**Meaning:** Users created in Auth but not linked to app database!

**FIX:**
```sql
\i database-create-test-users.sql
```

This will:
- Insert users into public.users table
- Grant roles (head, hr, exec, admin)
- Link to departments

---

### Problem 3: Departments table empty
**Meaning:** RBAC schema not created yet!

**FIX:**
```sql
\i database-comprehensive-rbac.sql
```

This creates:
- departments table (CCMS, CNAHS, etc.)
- role_grants table
- All RBAC structure

**Then run:**
```sql
\i database-create-test-users.sql
```

---

## 🚀 QUICK FIX SEQUENCE:

If you haven't done anything yet, do ALL 3 steps:

### Step 1: Create RBAC Schema
```sql
-- In Supabase SQL Editor:
\i database-comprehensive-rbac.sql
```

### Step 2: Create Auth Users
Go to Supabase Dashboard and create 6 users manually (see above)

### Step 3: Link to App Database
```sql
-- In Supabase SQL Editor:
\i database-create-test-users.sql
```

### Step 4: Verify
```sql
-- Check if all good:
\i verify-users.sql
```

Should see:
- ✅ 6 rows in auth.users
- ✅ 6 rows in public.users
- ✅ 4 rows with role grants (admin, head, hr, exec)
- ✅ Departments exist

---

## 📊 Expected Output (verify-users.sql):

### Query 1 - auth.users:
```
email                          | email_confirmed_at | created_at
-------------------------------|--------------------|-----------
admin@mseuf.edu.ph            | 2025-11-04         | 2025-11-04
comptroller@mseuf.edu.ph      | 2025-11-04         | 2025-11-04
exec.president@mseuf.edu.ph   | 2025-11-04         | 2025-11-04
faculty@mseuf.edu.ph          | 2025-11-04         | 2025-11-04
head.nursing@mseuf.edu.ph     | 2025-11-04         | 2025-11-04
hr.admin@mseuf.edu.ph         | 2025-11-04         | 2025-11-04
```

### Query 2 - public.users:
```
email                          | role_base | department
-------------------------------|-----------|------------
admin@mseuf.edu.ph            | admin     | NULL
comptroller@mseuf.edu.ph      | faculty   | NULL
exec.president@mseuf.edu.ph   | faculty   | NULL
faculty@mseuf.edu.ph          | faculty   | CCMS
head.nursing@mseuf.edu.ph     | faculty   | CNAHS
hr.admin@mseuf.edu.ph         | faculty   | NULL
```

### Query 3 - role_grants:
```
email                          | role  | revoked_at
-------------------------------|-------|------------
admin@mseuf.edu.ph            | admin | NULL
head.nursing@mseuf.edu.ph     | head  | NULL
hr.admin@mseuf.edu.ph         | hr    | NULL
exec.president@mseuf.edu.ph   | exec  | NULL
faculty@mseuf.edu.ph          | NULL  | NULL
```

---

## 🔥 AFTER FIXING:

### Test Login:
```
1. Go to: http://localhost:3000/login
2. Enter: faculty@mseuf.edu.ph / Test@123
3. Should redirect to: /user ✅
```

### Check Browser Console:
```
F12 → Console
Should see: (no 401 errors)
```

### Check Server Logs:
```
Should see:
POST /api/auth 200
GET /api/me 200 ✅ (not 401!)
```

---

## 💡 TL;DR - Most Likely Issue:

**You haven't created the users in Supabase Dashboard yet!**

**Quick Fix:**
1. Supabase Dashboard → Authentication → Users → Add User
2. Create 6 users (see credentials above)
3. Run SQL: `\i database-create-test-users.sql`
4. Test login

---

**Run verify-users.sql now to see what's missing! 🔍**
