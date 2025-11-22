# Check User Role Assignment

Verify if a user can be assigned a specific role.

## Checklist

### 1. Check Current Role and Permissions
```sql
SELECT 
  id,
  email,
  name,
  role,
  is_head,
  is_admin,
  is_hr,
  is_vp,
  is_president,
  department_id,
  exec_type
FROM public.users
WHERE id = 'user-id-here';
```

### 2. Check Subtable Entries
```sql
-- Check admins table
SELECT * FROM public.admins WHERE user_id = 'user-id-here';

-- Check faculties table
SELECT * FROM public.faculties WHERE user_id = 'user-id-here';

-- Check drivers table
SELECT * FROM public.drivers WHERE user_id = 'user-id-here';
```

### 3. Verify Department Assignment
```sql
SELECT 
  u.id,
  u.name,
  u.department_id,
  d.name as department_name,
  d.code as department_code
FROM public.users u
LEFT JOIN public.departments d ON u.department_id = d.id
WHERE u.id = 'user-id-here';
```

### 4. Check Role Grants History
```sql
SELECT 
  role,
  granted_at,
  granted_by,
  revoked_at,
  revoked_by,
  reason
FROM public.role_grants
WHERE user_id = 'user-id-here'
ORDER BY granted_at DESC;
```

### 5. Verify Role Constraints
```sql
-- Check if role is allowed
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_role_chk';
```

## Decision Matrix

| Target Role | Requires Subtable? | Requires Department? | Notes |
|------------|-------------------|---------------------|-------|
| admin | ✅ admins | ❌ | Use `assign_admin_role` RPC |
| faculty | ✅ faculties | ✅ | Use `assign_faculty_role` RPC |
| driver | ✅ drivers | ❌ | Use `assign_driver_role` RPC |
| head | ❌ | ✅ | Requires department assignment |
| hr | ❌ | ❌ | Direct assignment |
| exec (vp/president) | ❌ | ❌ | Set `exec_type` appropriately |
| comptroller | ❌ | ❌ | Direct assignment |
| staff | ❌ | ❌ | Direct assignment |

## Key Points
- Always check current state before assignment
- Verify subtable entries exist for admin/faculty/driver
- Check department assignment for head/faculty roles
- Review role grants history for audit trail
- Verify role is allowed by constraint

