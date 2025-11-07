-- ============================================
-- CHECK: TO-2025-069 (BOTH preferences missing!)
-- ============================================

-- 1. Check what was actually saved in database
SELECT 
  request_number,
  title,
  preferred_driver_id,
  preferred_vehicle_id,
  vehicle_type,
  created_at,
  CASE 
    WHEN preferred_driver_id IS NULL AND preferred_vehicle_id IS NULL THEN '❌ BOTH ARE NULL!'
    WHEN preferred_driver_id IS NULL THEN '⚠️ Only driver is NULL'
    WHEN preferred_vehicle_id IS NULL THEN '⚠️ Only vehicle is NULL'
    ELSE '✅ Both have values'
  END as status
FROM requests
WHERE request_number = 'TO-2025-069';

-- 2. Check if Ana Garcia exists in drivers
SELECT 
  'Ana Garcia Check' as check_type,
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  d.user_id as driver_user_id,
  CASE 
    WHEN u.id IS NULL THEN '❌ User not found'
    WHEN u.role != 'driver' THEN '⚠️ User exists but not a driver'
    WHEN d.user_id IS NULL THEN '⚠️ User is driver but no driver record'
    ELSE '✅ Driver exists'
  END as result
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.name ILIKE '%Ana Garcia%' OR u.email ILIKE '%ana%garcia%';

-- 3. Check all drivers that should appear in dropdown
SELECT 
  'All Drivers' as check_type,
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  u.status
FROM users u
WHERE u.role = 'driver'
ORDER BY u.name;
