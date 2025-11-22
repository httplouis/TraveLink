# Debug Supabase Query

Systematic approach to debugging Supabase queries in TraviLink.

## Debugging Steps

### 1. Add Detailed Logging
```typescript
console.log("[PREFIX] Starting query:", {
  table: 'table_name',
  operation: 'select/insert/update/delete',
  filters: { /* your filters */ },
  userId: userId
});

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', userId);

if (error) {
  console.error("[PREFIX] Query error:", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    fullError: error
  });
}
```

### 2. Check RLS Policies
```sql
-- List all RLS policies on a table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'table_name';
```

### 3. Verify Service Role Usage
```typescript
// For admin operations, use service_role
const supabase = await createSupabaseServerClient(true);

// Check if using correct client
console.log("[PREFIX] Using service_role:", true);
```

### 4. Test Query Directly in SQL
```sql
-- Test the exact query in Supabase SQL editor
SELECT * FROM public.table_name
WHERE id = 'user-id-here';
```

### 5. Check Foreign Key Constraints
```sql
-- If getting FK constraint error, check the constraint
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'constraint_name';
```

### 6. Check Trigger Functions
```sql
-- If trigger is blocking, check trigger definition
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'table_name';
```

## Common Issues

### RLS Blocking Access
- **Solution**: Use `service_role` client or fix RLS policy
- **Check**: Verify policy allows your operation

### Foreign Key Constraint
- **Solution**: Update constraint with proper `ON DELETE` behavior
- **Check**: Current `delete_rule` in constraint

### Trigger Blocking Operation
- **Solution**: Use database function to temporarily disable trigger
- **Check**: Trigger definition and conditions

### Missing Data
- **Solution**: Verify data exists with direct SQL query
- **Check**: Join conditions and filters

## Key Points
- Always log full error object (message, code, details, hint)
- Use [PREFIX] format for all logs
- Test queries directly in SQL editor
- Verify RLS policies allow your operation
- Check triggers if operations are blocked

