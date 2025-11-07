-- Fix admin approval foreign key constraints
-- Make them optional since admin users might not be in users table

-- Drop existing foreign key constraints
ALTER TABLE public.requests 
DROP CONSTRAINT IF EXISTS requests_admin_approved_by_fkey;

ALTER TABLE public.requests 
DROP CONSTRAINT IF EXISTS requests_assigned_driver_id_fkey;

-- Re-add as optional constraints (ON DELETE SET NULL instead of CASCADE)
-- This allows admin_approved_by to be a UUID that doesn't necessarily exist in users table
-- But we'll validate on application level

-- For now, let's just make the columns work without strict FK
-- Alternative: Add the constraint back with ON DELETE SET NULL if you want soft validation

-- Verify constraints were removed
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'requests' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name LIKE 'admin_%' OR kcu.column_name LIKE 'assigned_driver%'
ORDER BY tc.constraint_name;
