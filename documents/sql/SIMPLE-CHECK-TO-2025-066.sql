-- ============================================
-- SIMPLE CHECK: TO-2025-066 (No complex joins)
-- ============================================

-- 1. Check raw data in requests table
SELECT 
  request_number,
  title,
  preferred_driver_id,
  preferred_vehicle_id,
  created_at
FROM requests
WHERE request_number = 'TO-2025-066';

-- 2. Check if driver user exists
SELECT 
  'Driver Check' as check_type,
  r.request_number,
  r.preferred_driver_id,
  u.name as driver_name,
  u.email as driver_email,
  u.role as user_role,
  CASE 
    WHEN u.id IS NULL THEN '❌ User not found'
    WHEN u.role != 'driver' THEN '⚠️ User exists but not a driver'
    ELSE '✅ Driver user found'
  END as status
FROM requests r
LEFT JOIN users u ON u.id = r.preferred_driver_id
WHERE r.request_number = 'TO-2025-066';

-- 3. Check if vehicle exists
SELECT 
  'Vehicle Check' as check_type,
  r.request_number,
  r.preferred_vehicle_id,
  v.vehicle_name,
  v.plate_number,
  v.type,
  CASE 
    WHEN v.id IS NULL THEN '❌ Vehicle not found'
    ELSE '✅ Vehicle found'
  END as status
FROM requests r
LEFT JOIN vehicles v ON v.id = r.preferred_vehicle_id
WHERE r.request_number = 'TO-2025-066';

-- 4. Check drivers table structure (sample row)
SELECT *
FROM drivers
LIMIT 1;
