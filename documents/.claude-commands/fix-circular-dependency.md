# Fix Circular Dependency

Quick reference for fixing circular dependencies in role assignment.

## The Problem

```
users.role = 'admin' requires admins entry exists
admins entry requires users.role = 'admin'
```

## The Solution

Use database function that temporarily disables triggers:

```typescript
// In API route
const { error } = await supabase.rpc('assign_admin_role', {
  p_user_id: userId
});
```

## Available Functions

- `assign_admin_role(p_user_id)` - For admin role
- `assign_faculty_role(p_user_id, p_department_id)` - For faculty role  
- `assign_driver_role(p_user_id)` - For driver role

## If Function Doesn't Exist

1. Check if function exists:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines
   WHERE routine_name = 'assign_admin_role';
   ```

2. If not, create it (see `.cursor/commands/fix-circular-dependency.md`)

3. Apply migration using Supabase MCP tool

## Key Points
- Always use RPC functions for admin/faculty/driver roles
- Functions handle trigger disabling/enabling automatically
- Include error handling in code
- Test after creating function

