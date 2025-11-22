-- =====================================================
-- DEEP DIVE: Why is API returning empty?
-- =====================================================

-- 1. Check if drivers table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('drivers', 'users', 'vehicles');

-- 2. Check RLS policies on drivers table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('drivers', 'users');

-- 3. Try to select as anonymous (what the API sees)
SET ROLE anon;
SELECT COUNT(*) as driver_count FROM drivers;
SELECT COUNT(*) as user_count FROM users WHERE role = 'driver';
RESET ROLE;

-- 4. Try to select as authenticated
SET ROLE authenticated;
SELECT COUNT(*) as driver_count FROM drivers;
SELECT COUNT(*) as user_count FROM users WHERE role = 'driver';
RESET ROLE;

-- 5. Check if data actually exists (as admin)
SELECT COUNT(*) as total_drivers FROM drivers;
SELECT COUNT(*) as total_users_driver_role FROM users WHERE role = 'driver';

-- 6. Test the exact query the API uses
SELECT 
  d.*,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.status as user_status
FROM drivers d
INNER JOIN users u ON d.user_id = u.id;

-- =====================================================
-- EXPECTED RESULTS:
-- If RLS is blocking:
--   - anon/authenticated queries will return 0
--   - admin query will return 5
--   - Need to add RLS policies or disable RLS
--
-- If data doesn't exist:
--   - All queries return 0
--   - Need to re-run migration
-- =====================================================
