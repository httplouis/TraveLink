-- DEBUG: Check why drivers API returns empty

-- 1. Check if drivers exist
SELECT COUNT(*) as driver_count FROM drivers;

-- 2. Check users with role='driver'
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status
FROM users u
WHERE u.role = 'driver';

-- 3. Check the full join (what the API does)
SELECT 
  d.user_id,
  d.license_no,
  d.license_expiry,
  d.driver_rating,
  u.id as user_id_from_users,
  u.name,
  u.email,
  u.status
FROM drivers d
JOIN users u ON d.user_id = u.id;

-- 4. Check if any have status='active'
SELECT 
  u.name,
  u.status,
  CASE 
    WHEN u.status = 'active' THEN 'YES - Will show in API'
    ELSE 'NO - Filtered out by available=true'
  END as will_show
FROM drivers d
JOIN users u ON d.user_id = u.id;

-- EXPECTED RESULTS:
-- - driver_count should be 5
-- - Should see 5 drivers with their info
-- - Status should be 'active' for all
-- - If status is NOT 'active', that's why API returns empty!
