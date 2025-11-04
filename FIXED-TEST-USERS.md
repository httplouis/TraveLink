# ✅ FIXED - Test Users SQL Script

## Problem Found:
`users` table doesn't have `full_name` column!

## Actual Columns in Users Table:
```sql
auth_user_id     UUID (FK to auth.users)
email            VARCHAR
role_base        VARCHAR(20)  -- 'faculty', 'driver', 'admin'
department_id    UUID (FK to departments)
is_active        BOOLEAN
signature        TEXT
```

## ✅ Fixed SQL Script:

**File:** `database-create-test-users.sql` (UPDATED)

**Changes:**
- ❌ REMOVED: `full_name` column
- ✅ USES: `role_base` column
- ✅ USES: `department_id` (FK) instead of `department` (text)

## 🚀 Now Run This:

```sql
-- In Supabase SQL Editor:
\i database-create-test-users.sql
```

Should work now! ✅

---

## Verification Query:

After running, check with:

```sql
SELECT 
    u.email,
    u.role_base,
    d.name as department,
    STRING_AGG(rg.role, ', ') as granted_roles
FROM public.users u
LEFT JOIN public.role_grants rg ON rg.user_id = u.id AND rg.revoked_at IS NULL
LEFT JOIN public.departments d ON d.id = u.department_id
WHERE u.email IN (
    'faculty@mseuf.edu.ph',
    'head.nursing@mseuf.edu.ph',
    'hr.admin@mseuf.edu.ph',
    'comptroller@mseuf.edu.ph',
    'exec.president@mseuf.edu.ph',
    'admin@mseuf.edu.ph'
)
GROUP BY u.id, u.email, u.role_base, d.name
ORDER BY u.email;
```

Expected Result:
```
email                          | role_base | department | granted_roles
-------------------------------|-----------|------------|---------------
admin@mseuf.edu.ph            | admin     | NULL       | admin
comptroller@mseuf.edu.ph      | faculty   | NULL       | (null)
exec.president@mseuf.edu.ph   | faculty   | NULL       | exec
faculty@mseuf.edu.ph          | faculty   | CCMS       | (null)
head.nursing@mseuf.edu.ph     | faculty   | CNAHS      | head
hr.admin@mseuf.edu.ph         | faculty   | NULL       | hr
```

---

## Full Name Issue:

**Q:** Where to store user's full name?

**A:** Options:

### Option 1: Use auth.users.raw_user_meta_data
```sql
-- When creating in Supabase Dashboard, add:
User Metadata → { "full_name": "John Doe" }
```

### Option 2: Add column to users table
```sql
ALTER TABLE public.users ADD COLUMN name TEXT;

UPDATE public.users 
SET name = 'John Doe'
WHERE email = 'faculty@mseuf.edu.ph';
```

### Option 3: Get from auth.users.email
```sql
-- Extract name from email or use email as display
SELECT split_part(email, '@', 1) as display_name
FROM public.users;
```

**For now:** Just use email or add `name` column if needed.

---

**Script fixed! Try running again! 🎉**
