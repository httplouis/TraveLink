-- EMERGENCY: Check if data exists and why JOIN fails

-- 1. Do drivers exist?
SELECT 'Drivers count:' as check_type, COUNT(*) as count FROM drivers;

-- 2. Do users with driver role exist?
SELECT 'Users with driver role:' as check_type, COUNT(*) as count FROM users WHERE role = 'driver';

-- 3. Check user_id values in drivers table
SELECT 
  'Driver user_ids:' as check_type,
  user_id,
  license_no
FROM drivers
LIMIT 5;

-- 4. Check if those user_ids exist in users table
SELECT 
  'Matching users:' as check_type,
  d.license_no,
  d.user_id as driver_user_id,
  u.id as user_id_from_users,
  u.name,
  u.email,
  u.role
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id;

-- 5. Check for NULL user_ids (orphaned drivers)
SELECT 
  'Orphaned drivers (no matching user):' as check_type,
  COUNT(*) as count
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL;

-- THIS WILL TELL US EXACTLY WHAT'S WRONG!
