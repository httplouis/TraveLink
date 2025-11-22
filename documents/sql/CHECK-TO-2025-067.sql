-- ============================================
-- CHECK: TO-2025-067 (NEW request after fixes)
-- ============================================

-- 1. Check raw request data
SELECT 
  request_number,
  title,
  preferred_driver_id,
  preferred_vehicle_id,
  created_at,
  CASE 
    WHEN preferred_driver_id IS NULL THEN '❌ NO DRIVER ID IN DATABASE'
    ELSE '✅ Driver ID: ' || preferred_driver_id
  END as driver_status
FROM requests
WHERE request_number = 'TO-2025-067';

-- 2. If driver_id exists, get driver details
SELECT 
  'Driver Details' as info_type,
  r.request_number,
  r.preferred_driver_id,
  u.id as user_id,
  u.name as driver_name,
  u.email as driver_email,
  u.role as user_role,
  u.status as user_status
FROM requests r
LEFT JOIN users u ON u.id = r.preferred_driver_id
WHERE r.request_number = 'TO-2025-067';

-- 3. Check vehicle (should be working)
SELECT 
  'Vehicle Details' as info_type,
  r.request_number,
  r.preferred_vehicle_id,
  v.id as vehicle_id,
  v.vehicle_name,
  v.plate_number
FROM requests r
LEFT JOIN vehicles v ON v.id = r.preferred_vehicle_id
WHERE r.request_number = 'TO-2025-067';

-- 4. Simulate API response (what the UI should receive)
SELECT 
  r.request_number,
  r.preferred_driver_id,
  r.preferred_vehicle_id,
  -- What API should return for driver
  u.name as preferred_driver_name,
  -- What API should return for vehicle
  v.vehicle_name || ' • ' || v.plate_number as preferred_vehicle_name,
  -- Status check
  CASE 
    WHEN r.preferred_driver_id IS NULL THEN '❌ Driver ID is NULL'
    WHEN u.id IS NULL THEN '❌ Driver user not found'
    WHEN u.name IS NULL THEN '❌ Driver name is NULL'
    ELSE '✅ Driver data complete'
  END as driver_fetch_status
FROM requests r
LEFT JOIN users u ON u.id = r.preferred_driver_id
LEFT JOIN vehicles v ON v.id = r.preferred_vehicle_id
WHERE r.request_number = 'TO-2025-067';
