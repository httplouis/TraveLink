# Add Role Assignment Logic

Guide for implementing role assignment in TraviLink.

## Checklist

### 1. Check Role Requirements
```typescript
// Roles that require subtable entries:
const roleSubtables = {
  'admin': 'admins',
  'faculty': 'faculties',
  'driver': 'drivers'
};
```

### 2. Handle Circular Dependencies
```typescript
// Use RPC functions for roles with circular dependencies
if (role === 'admin') {
  const { error } = await supabase.rpc('assign_admin_role', {
    p_user_id: userId
  });
}

if (role === 'faculty') {
  const { error } = await supabase.rpc('assign_faculty_role', {
    p_user_id: userId,
    p_department_id: departmentId
  });
}

if (role === 'driver') {
  const { error } = await supabase.rpc('assign_driver_role', {
    p_user_id: userId
  });
}
```

### 3. Update Role Grants (Audit Trail)
```typescript
// Revoke old role grant if exists
await supabase
  .from('role_grants')
  .update({
    revoked_at: new Date().toISOString(),
    revoked_by: adminUserId,
    reason: `Role changed to ${newRole}`
  })
  .eq('user_id', userId)
  .eq('role', oldRole)
  .is('revoked_at', null);

// Create new role grant
await supabase
  .from('role_grants')
  .insert({
    user_id: userId,
    role: newRole,
    granted_at: new Date().toISOString(),
    granted_by: adminUserId,
    reason: `Role assigned by admin`
  });
```

### 4. Update Permission Flags
```typescript
const updateData: any = {
  role: newRole,
  exec_type: null
};

// Clear all flags first
updateData.is_head = false;
updateData.is_admin = false;
updateData.is_hr = false;
updateData.is_vp = false;
updateData.is_president = false;

// Set appropriate flag
if (newRole === 'head') {
  updateData.is_head = true;
} else if (newRole === 'admin') {
  updateData.is_admin = true;
} else if (newRole === 'hr') {
  updateData.is_hr = true;
} else if (newRole === 'exec') {
  if (execType === 'vp') {
    updateData.is_vp = true;
    updateData.exec_type = 'vp';
  } else if (execType === 'president') {
    updateData.is_president = true;
    updateData.exec_type = 'president';
  }
}
```

### 5. Log to Audit Logs
```typescript
await supabase
  .from('audit_logs')
  .insert({
    user_id: adminUserId,
    action: 'update',
    entity_type: 'user',
    entity_id: userId,
    old_value: oldUserData,
    new_value: newUserData,
    ip_address: req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent')
  });
```

## Role Mapping
- `vp` → `exec` (with `exec_type = 'vp'`)
- `president` → `exec` (with `exec_type = 'president'`)
- `comptroller` → `comptroller` (direct)

## Key Points
- Always use RPC functions for admin/faculty/driver roles
- Update role_grants for complete audit trail
- Clear all flags before setting new ones
- Log everything to audit_logs
- Include password confirmation for admin actions

