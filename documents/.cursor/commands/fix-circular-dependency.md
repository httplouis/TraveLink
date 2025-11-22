# Fix Circular Dependency

Guide for handling circular dependencies in role assignment.

## Problem

Circular dependency occurs when:
- Trigger on `users` table checks if entry exists in `admins` table
- Trigger on `admins` table checks if user role is `admin`
- Can't update `users.role` without `admins` entry
- Can't insert into `admins` without `users.role = 'admin'`

## Solution: Database Function

Create a database function that temporarily disables triggers:

```sql
CREATE OR REPLACE FUNCTION public.assign_admin_role(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_admins_trigger_exists BOOLEAN;
  v_users_trigger_exists BOOLEAN;
BEGIN
  -- Check if triggers exist
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'admins'
      AND t.tgname = 'trg_admins_role_guard'
  ) INTO v_admins_trigger_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'users'
      AND t.tgname = 'trg_users_role_change_guard'
  ) INTO v_users_trigger_exists;
  
  -- Disable triggers
  IF v_admins_trigger_exists THEN
    ALTER TABLE public.admins DISABLE TRIGGER trg_admins_role_guard;
  END IF;
  
  IF v_users_trigger_exists THEN
    ALTER TABLE public.users DISABLE TRIGGER trg_users_role_change_guard;
  END IF;
  
  -- Update role
  UPDATE public.users
  SET role = 'admin', is_admin = true
  WHERE id = p_user_id;
  
  -- Insert into admins
  INSERT INTO public.admins (user_id, super_admin)
  VALUES (p_user_id, true)
  ON CONFLICT (user_id) DO UPDATE
  SET super_admin = true;
  
  -- Re-enable triggers
  IF v_admins_trigger_exists THEN
    ALTER TABLE public.admins ENABLE TRIGGER trg_admins_role_guard;
  END IF;
  
  IF v_users_trigger_exists THEN
    ALTER TABLE public.users ENABLE TRIGGER trg_users_role_change_guard;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Always re-enable on error
    IF v_admins_trigger_exists THEN
      ALTER TABLE public.admins ENABLE TRIGGER trg_admins_role_guard;
    END IF;
    IF v_users_trigger_exists THEN
      ALTER TABLE public.users ENABLE TRIGGER trg_users_role_change_guard;
    END IF;
    RAISE;
END;
$function$;
```

## Usage in Code

```typescript
try {
  const { error } = await supabase.rpc('assign_admin_role', {
    p_user_id: userId
  });
  
  if (error) {
    throw error;
  }
  
  // Role is now updated, proceed with other updates
} catch (error: any) {
  console.error("[PREFIX] RPC error:", error);
  // Handle error
}
```

## Similar Functions

- `assign_faculty_role(p_user_id, p_department_id)` - for faculty role
- `assign_driver_role(p_user_id)` - for driver role

## Key Points
- Always disable both triggers (users and subtables)
- Re-enable triggers even on error (use EXCEPTION block)
- Use `SECURITY DEFINER` to bypass RLS if needed
- Check if triggers exist before disabling
- Test thoroughly after creating function

