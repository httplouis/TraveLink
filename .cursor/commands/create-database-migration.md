# Create Database Migration

Create a SQL migration file for TraviLink database changes.

## Template

```sql
-- ============================================
-- MIGRATION NAME: Brief description
-- ============================================
-- Purpose: Explain what this migration does and why
-- Date: YYYY-MM-DD
-- Related Issue: (if applicable)

-- Step 1: Drop existing constraint if it exists
ALTER TABLE public.table_name
DROP CONSTRAINT IF EXISTS constraint_name;

-- Step 2: Create new constraint with proper ON DELETE behavior
ALTER TABLE public.table_name
ADD CONSTRAINT constraint_name 
FOREIGN KEY (column_name) 
REFERENCES other_table(id)
ON DELETE SET NULL; -- or CASCADE

-- Step 3: Verification queries
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.table_constraints
WHERE constraint_name = 'constraint_name';

-- ============================================
-- ✅ VERIFICATION
-- ============================================
-- Run the verification queries above to confirm changes
```

## Common Patterns

### Fix Foreign Key Constraint
```sql
-- Drop and recreate with ON DELETE SET NULL
ALTER TABLE public.table_name
DROP CONSTRAINT IF EXISTS fk_name;

ALTER TABLE public.table_name
ADD CONSTRAINT fk_name 
FOREIGN KEY (column_name) 
REFERENCES other_table(id)
ON DELETE SET NULL;
```

### Add RLS Policy
```sql
-- Allow service_role full access
DROP POLICY IF EXISTS service_role_all_table_name ON public.table_name;
CREATE POLICY service_role_all_table_name ON public.table_name
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### Modify Column
```sql
-- Make column nullable
ALTER TABLE public.table_name
ALTER COLUMN column_name DROP NOT NULL;
```

## Key Points
- Always use `IF EXISTS` for DROP operations
- Include verification queries
- Add clear comments
- Test on copy of production data first

