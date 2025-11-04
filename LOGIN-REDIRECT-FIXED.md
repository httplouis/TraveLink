# ✅ LOGIN REDIRECT - FIXED!

## Problem Found:

**Query was looking for wrong columns!**

### Old Code (WRONG):
```typescript
// ❌ Querying columns that don't exist
const { data: profile } = await supabase
  .from("users")
  .select("role, department")  // ❌ NO "role" column!
  .eq("auth_user_id", user.id);

const role = profile?.role ?? "faculty";  // ❌ Always undefined!
```

### New Code (FIXED):
```typescript
// ✅ Query correct columns + role_grants table
const { data: profile } = await supabase
  .from("users")
  .select(`
    role_base,
    department_id,
    role_grants!inner(role, revoked_at)
  `)
  .eq("auth_user_id", user.id);

// ✅ Check granted roles
const grantedRoles = profile?.role_grants
  ?.filter((rg: any) => !rg.revoked_at)
  .map((rg: any) => rg.role) ?? [];

const isAdmin = roleBase === "admin" || grantedRoles.includes("admin");
const isHead = grantedRoles.includes("head");
const isHR = grantedRoles.includes("hr");
const isExec = grantedRoles.includes("exec");
```

---

## Files Fixed (2):

### 1. `src/app/login/page.tsx` ✅
**Changed:**
- ❌ Query `role` column → ✅ Query `role_base` + `role_grants`
- ❌ Simple string check → ✅ Check role_grants table
- ❌ Wrong redirect logic → ✅ Priority-based redirect

**New Redirect Logic:**
```typescript
if (isAdmin) {
  router.push("/admin");
} else if (isHead) {
  router.push("/head/dashboard");
} else if (isHR) {
  router.push("/hr/dashboard");
} else if (isExec) {
  router.push("/exec/dashboard");
} else if (roleBase === "driver") {
  router.push("/driver");
} else {
  router.push("/user");  // Regular faculty
}
```

### 2. `src/app/api/me/route.ts` ✅
**Changed:**
- ❌ Query `full_name, role` → ✅ Query `role_base`
- ❌ Return `role` directly → ✅ Calculate from `role_base` + grants
- ✅ Added `isAdmin` check

---

## Expected Behavior Now:

### Test Accounts → Redirects:

| Email | Role Grants | Redirects To |
|-------|-------------|--------------|
| admin@mseuf.edu.ph | admin | `/admin` ✅ |
| head.nursing@mseuf.edu.ph | head | `/head/dashboard` ✅ |
| hr.admin@mseuf.edu.ph | hr | `/hr/dashboard` ✅ |
| exec.president@mseuf.edu.ph | exec | `/exec/dashboard` ✅ |
| faculty@mseuf.edu.ph | (none) | `/user` ✅ |
| comptroller@mseuf.edu.ph | (none) | `/user` ✅ |

---

## How It Works Now:

### 1. Login Page:
```
User enters credentials
↓
Supabase auth.signInWithPassword()
↓
Get user profile from users table
↓
Get role_grants (head, hr, exec, admin)
↓
Redirect based on highest privilege:
  - Admin → /admin
  - Head → /head/dashboard
  - HR → /hr/dashboard
  - Exec → /exec/dashboard
  - Driver → /driver
  - Faculty → /user
```

### 2. Middleware (Protection):
```
User visits protected page
↓
Call /api/me to get user info
↓
Check role_grants for permissions
↓
Allow/Deny access based on role
```

### 3. /api/me (User Info):
```
Get auth user
↓
Query users table (role_base, department_id)
↓
Query role_grants table (head, hr, exec, admin)
↓
Return combined user object with all permissions
```

---

## Database Schema (Correct):

### `users` table:
```sql
auth_user_id   UUID (FK)
email          VARCHAR
role_base      VARCHAR(20)  -- 'faculty', 'driver', 'admin'
department_id  UUID (FK)
is_active      BOOLEAN
```

### `role_grants` table:
```sql
user_id     UUID (FK to users)
role        VARCHAR(20)  -- 'head', 'hr', 'exec', 'comptroller', 'admin'
granted_by  UUID
revoked_at  TIMESTAMP
```

**Ground Truth:** `role_grants` table is authoritative for special roles!

---

## Test Now:

```bash
# 1. Make sure test users created in Supabase Dashboard
# 2. Make sure database-create-test-users.sql ran successfully
# 3. Restart dev server:
pnpm dev

# 4. Test each account:
```

### Test Admin:
```
Email: admin@mseuf.edu.ph
Password: Admin@123
Expected: Redirect to /admin ✅
```

### Test Head:
```
Email: head.nursing@mseuf.edu.ph
Password: Test@123
Expected: Redirect to /head/dashboard ✅
```

### Test HR:
```
Email: hr.admin@mseuf.edu.ph
Password: Test@123
Expected: Redirect to /hr/dashboard ✅
```

### Test Faculty:
```
Email: faculty@mseuf.edu.ph
Password: Test@123
Expected: Redirect to /user ✅
```

---

## Troubleshooting:

### Still redirects to wrong page?

**Check role_grants table:**
```sql
SELECT 
    u.email,
    rg.role,
    rg.revoked_at
FROM users u
LEFT JOIN role_grants rg ON rg.user_id = u.id
WHERE u.email = 'your-email@mseuf.edu.ph';
```

**Should show:**
- admin@mseuf.edu.ph → role: 'admin', revoked_at: NULL
- head.nursing@mseuf.edu.ph → role: 'head', revoked_at: NULL
- etc.

### "Profile not found" error?

**Check users table:**
```sql
SELECT * FROM users WHERE email = 'your-email@mseuf.edu.ph';
```

If empty → User not linked! Run:
```sql
\i database-create-test-users.sql
```

---

## Summary:

✅ **Login redirect** - FIXED (queries correct columns)  
✅ **API /me route** - FIXED (queries role_base + role_grants)  
✅ **Role checking** - Uses role_grants table (Ground Truth)  
✅ **Redirect logic** - Priority-based (admin > head > hr > exec > driver > user)  

**Test all accounts now - should redirect to correct dashboards! 🎉**
