-- ============================================
-- CHECK WHICH ROLE COLUMNS EXIST
-- ============================================
-- Run this first to see what columns you have

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name LIKE 'is_%'
ORDER BY column_name;

-- Also check role column
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'role';

