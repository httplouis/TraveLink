# 🔐 How to Create Test Users - Step by Step

## Why Accounts Don't Work Yet:

Yung TEST-CREDENTIALS.md is **documentation lang**. Hindi pa actual users sa database!

Kailangan pa natin i-create sa Supabase.

---

## ✅ EASIEST METHOD (Recommended):

### Step 1: Go to Supabase Dashboard

1. Open Supabase project: https://supabase.com
2. Go to your TraviLink project
3. Click **"Authentication"** sa left sidebar
4. Click **"Users"** tab
5. Click **"Add User"** button (green button top right)

### Step 2: Create Each User

**Create 6 users one by one:**

#### User 1: Faculty
```
Email: faculty@mseuf.edu.ph
Password: Test@123
✅ Check "Auto Confirm User"
Click "Create User"
```

#### User 2: Department Head
```
Email: head.nursing@mseuf.edu.ph
Password: Test@123
✅ Check "Auto Confirm User"
Click "Create User"
```

#### User 3: HR
```
Email: hr.admin@mseuf.edu.ph
Password: Test@123
✅ Check "Auto Confirm User"
Click "Create User"
```

#### User 4: Comptroller
```
Email: comptroller@mseuf.edu.ph
Password: Test@123
✅ Check "Auto Confirm User"
Click "Create User"
```

#### User 5: Executive
```
Email: exec.president@mseuf.edu.ph
Password: Test@123
✅ Check "Auto Confirm User"
Click "Create User"
```

#### User 6: Admin
```
Email: admin@mseuf.edu.ph
Password: Admin@123
✅ Check "Auto Confirm User"
Click "Create User"
```

---

### Step 3: Link to App Database

After creating users in Authentication, run this SQL:

```sql
-- Run in Supabase SQL Editor:
\i database-create-test-users.sql
```

This will:
- ✅ Insert users into `public.users` table
- ✅ Grant appropriate roles via `role_grants` table
- ✅ Add Department Head to `department_heads` table
- ✅ Add to `roster_heads` for auto-grant

---

## 🎯 ALTERNATIVE METHOD (SQL Only):

If you want to create via SQL only (not recommended, but possible):

### For Supabase CLI Users:

```bash
# Create users via Supabase CLI
supabase auth users create faculty@mseuf.edu.ph --password Test@123 --confirm
supabase auth users create head.nursing@mseuf.edu.ph --password Test@123 --confirm
supabase auth users create hr.admin@mseuf.edu.ph --password Test@123 --confirm
supabase auth users create comptroller@mseuf.edu.ph --password Test@123 --confirm
supabase auth users create exec.president@mseuf.edu.ph --password Test@123 --confirm
supabase auth users create admin@mseuf.edu.ph --password Admin@123 --confirm
```

Then run:
```sql
\i database-create-test-users.sql
```

---

## ✅ VERIFICATION:

### After Creating Users:

**Test Login:**
```
1. Go to: http://localhost:3000/login
2. Try: faculty@mseuf.edu.ph / Test@123
3. Should redirect to /user dashboard ✅
```

**Check Database:**
```sql
-- See all test users:
SELECT 
    u.email,
    u.full_name,
    u.department,
    STRING_AGG(rg.role, ', ') as roles
FROM public.users u
LEFT JOIN public.role_grants rg ON rg.user_id = u.id 
WHERE u.email LIKE '%mseuf.edu.ph'
GROUP BY u.id, u.email, u.full_name, u.department;
```

Should show:
```
email                          | full_name              | roles
-------------------------------|------------------------|--------
faculty@mseuf.edu.ph          | John Doe               | (null)
head.nursing@mseuf.edu.ph     | Dr. Maria Santos       | head
hr.admin@mseuf.edu.ph         | HR Administrator       | hr
comptroller@mseuf.edu.ph      | Finance Officer        | (null)
exec.president@mseuf.edu.ph   | University President   | exec
admin@mseuf.edu.ph            | System Administrator   | admin
```

---

## 🔍 TROUBLESHOOTING:

### Problem: "Invalid login credentials"

**Possible causes:**
1. User not created in Supabase Auth
2. Wrong password
3. Email not confirmed

**Solution:**
- Go to Supabase Dashboard → Authentication → Users
- Check if user exists
- Check "Email Confirmed" column - should be ✅
- If not confirmed, click user → "Confirm Email"

### Problem: "User not found in users table"

**Cause:**
Auth user exists, but not in `public.users` table

**Solution:**
```sql
-- Run this for each user:
INSERT INTO public.users (auth_user_id, email, full_name)
SELECT id, email, 'User Name'
FROM auth.users 
WHERE email = 'user@mseuf.edu.ph'
ON CONFLICT DO NOTHING;
```

### Problem: "Access denied" after login

**Cause:**
User doesn't have proper role grants

**Solution:**
```sql
-- Grant role manually:
INSERT INTO public.role_grants (user_id, role, reason)
SELECT 
    u.id,
    'head', -- or 'hr', 'exec', 'admin'
    'Manual grant'
FROM public.users u
WHERE u.email = 'user@mseuf.edu.ph'
ON CONFLICT DO NOTHING;
```

---

## 📝 QUICK REFERENCE:

### All Test Credentials:

| Role | Email | Password |
|------|-------|----------|
| Faculty | faculty@mseuf.edu.ph | Test@123 |
| Department Head | head.nursing@mseuf.edu.ph | Test@123 |
| HR | hr.admin@mseuf.edu.ph | Test@123 |
| Comptroller | comptroller@mseuf.edu.ph | Test@123 |
| Executive | exec.president@mseuf.edu.ph | Test@123 |
| Admin | admin@mseuf.edu.ph | Admin@123 |

### Expected Behavior:

| User | Login → Redirect |
|------|------------------|
| faculty@mseuf.edu.ph | → /user |
| head.nursing@mseuf.edu.ph | → /head/dashboard |
| hr.admin@mseuf.edu.ph | → /hr/dashboard |
| exec.president@mseuf.edu.ph | → /exec/dashboard |
| admin@mseuf.edu.ph | → /admin |

---

## 🚀 SUMMARY:

**3 Steps Total:**

1. ✅ **Create users** in Supabase Dashboard (Authentication → Users → Add User)
2. ✅ **Run SQL script** to link to app database: `\i database-create-test-users.sql`
3. ✅ **Test login** at http://localhost:3000/login

**That's it! Users ready! 🎉**
