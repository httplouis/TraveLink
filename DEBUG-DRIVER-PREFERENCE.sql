-- ============================================
-- DEBUG: Check why driver name is not showing
-- ============================================

-- 1. Check request TO-2025-065 (from the screenshot)
SELECT 
  id,
  request_number,
  title,
  preferred_driver_id,
  preferred_vehicle_id,
  created_at,
  CASE 
    WHEN preferred_driver_id IS NULL THEN '❌ NO DRIVER SELECTED'
    ELSE '✅ Has driver ID'
  END as driver_status,
  CASE 
    WHEN preferred_vehicle_id IS NULL THEN '❌ NO VEHICLE SELECTED'
    ELSE '✅ Has vehicle ID'
  END as vehicle_status
FROM requests
WHERE request_number = 'TO-2025-065'
LIMIT 1;

-- 2. If driver_id exists, check if the driver exists in users table
SELECT 
  r.request_number,
  r.preferred_driver_id,
  u.id as user_id,
  u.name as driver_name,
  u.email,
  u.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ DRIVER USER NOT FOUND'
    WHEN u.role != 'driver' THEN '⚠️ User exists but role is not driver'
    ELSE '✅ Driver user exists'
  END as result
FROM requests r
LEFT JOIN users u ON u.id = r.preferred_driver_id
WHERE r.request_number = 'TO-2025-065';

-- 3. Check all recent requests and their driver/vehicle preferences
SELECT 
  request_number,
  title,
  preferred_driver_id,
  preferred_vehicle_id,
  created_at,
  CASE 
    WHEN preferred_driver_id IS NOT NULL THEN 
      COALESCE((SELECT name FROM users WHERE id = preferred_driver_id), '❌ Driver not found')
    ELSE 'No driver selected'
  END as driver_name,
  CASE 
    WHEN preferred_vehicle_id IS NOT NULL THEN 
      COALESCE((SELECT vehicle_name || ' • ' || plate_number FROM vehicles WHERE id = preferred_vehicle_id), '❌ Vehicle not found')
    ELSE 'No vehicle selected'
  END as vehicle_name
FROM requests
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Summary: Count how many requests have preferences
SELECT 
  COUNT(*) as total_requests,
  SUM(CASE WHEN preferred_driver_id IS NOT NULL THEN 1 ELSE 0 END) as with_driver_preference,
  SUM(CASE WHEN preferred_vehicle_id IS NOT NULL THEN 1 ELSE 0 END) as with_vehicle_preference,
  SUM(CASE WHEN preferred_driver_id IS NOT NULL AND preferred_vehicle_id IS NOT NULL THEN 1 ELSE 0 END) as with_both
FROM requests
WHERE created_at >= NOW() - INTERVAL '7 days';
