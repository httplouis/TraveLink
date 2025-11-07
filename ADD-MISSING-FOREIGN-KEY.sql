-- ============================================
-- ADD MISSING FOREIGN KEY FOR admin_approved_by
-- ============================================

-- Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'requests' 
  AND column_name = 'admin_approved_by';

-- Check existing foreign keys on requests table
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'public.requests'::regclass
  AND c.contype = 'f'
ORDER BY conname;

-- Add the missing foreign key constraint
-- (This will fail if it already exists, which is fine)
ALTER TABLE public.requests
ADD CONSTRAINT requests_admin_approved_by_fkey 
FOREIGN KEY (admin_approved_by) 
REFERENCES public.users(id);

-- Verify it was added
SELECT
    conname AS constraint_name,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'public.requests'::regclass
  AND c.contype = 'f'
  AND conname = 'requests_admin_approved_by_fkey';

-- ============================================
-- ✅ After running, refresh the page!
-- ============================================
