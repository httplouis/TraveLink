-- Check what the actual requester column name is

-- 1. List all columns in requests table that contain 'requester'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name LIKE '%requester%'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints to users table
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'requests'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users';
