-- ============================================
-- CHECK WHAT DATA ALREADY EXISTS
-- ============================================

-- 1. Check all drivers (users + drivers table)
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  d.license_no,
  d.license_expiry,
  'EXISTS in database' as source
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.role = 'driver'
  OR u.email ILIKE '%driver%'
ORDER BY u.name;

-- 2. Check all vehicles
SELECT 
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status,
  notes,
  'EXISTS in database' as source
FROM vehicles
ORDER BY vehicle_name;

-- 3. Check if Pedro Reyes exists specifically
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Pedro Reyes EXISTS'
    ELSE '❌ Pedro Reyes NOT FOUND'
  END as pedro_status,
  COUNT(*) as count
FROM users 
WHERE name ILIKE '%Pedro%Reyes%' 
   OR email LIKE '%pedro%reyes%';

-- 4. Check if Bus 1 / MSE-001 exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Bus 1 EXISTS'
    ELSE '❌ Bus 1 NOT FOUND'
  END as bus_status,
  COUNT(*) as count
FROM vehicles 
WHERE plate_number = 'MSE-001' 
   OR vehicle_name ILIKE '%Bus 1%';

-- 5. Check API filter criteria for drivers
-- API requires: role='driver' AND email contains 'driver'
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  CASE 
    WHEN u.role = 'driver' AND u.email ILIKE '%driver%' THEN '✅ WILL APPEAR in dropdown'
    WHEN u.role = 'driver' THEN '⚠️ Has role but email missing driver'
    WHEN u.email ILIKE '%driver%' THEN '⚠️ Has driver in email but role not driver'
    ELSE '❌ Will NOT appear'
  END as api_filter_result
FROM users u
WHERE u.role = 'driver' OR u.email ILIKE '%driver%'
ORDER BY api_filter_result, u.name;

-- 6. Summary
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'driver') as total_driver_role_users,
  (SELECT COUNT(*) FROM users WHERE role = 'driver' AND email ILIKE '%driver%') as drivers_matching_api_filter,
  (SELECT COUNT(*) FROM drivers) as drivers_table_count,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'available') as available_vehicles;
