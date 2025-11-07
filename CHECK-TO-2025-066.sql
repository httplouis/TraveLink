-- ============================================
-- CHECK: TO-2025-066 Driver/Vehicle Data
-- ============================================

-- 1. Check if driver and vehicle IDs are in the database
SELECT 
  id,
  request_number,
  title,
  preferred_driver_id,
  preferred_vehicle_id,
  created_at,
  CASE 
    WHEN preferred_driver_id IS NULL THEN '❌ NO DRIVER ID'
    ELSE '✅ Driver ID: ' || preferred_driver_id
  END as driver_status,
  CASE 
    WHEN preferred_vehicle_id IS NULL THEN '❌ NO VEHICLE ID'
    ELSE '✅ Vehicle ID: ' || preferred_vehicle_id
  END as vehicle_status
FROM requests
WHERE request_number = 'TO-2025-066';

-- 2. If driver_id exists, check the user
SELECT 
  r.request_number,
  r.preferred_driver_id,
  u.id as user_id,
  u.name as driver_name,
  u.email as driver_email,
  u.role as user_role,
  d.id as driver_record_id,
  CASE 
    WHEN u.id IS NULL THEN '❌ USER NOT FOUND'
    WHEN d.id IS NULL THEN '⚠️ User exists but NO driver record'
    ELSE '✅ Driver record exists'
  END as result
FROM requests r
LEFT JOIN users u ON u.id = r.preferred_driver_id
LEFT JOIN drivers d ON d.user_id = u.id
WHERE r.request_number = 'TO-2025-066';

-- 3. If vehicle_id exists, check the vehicle
SELECT 
  r.request_number,
  r.preferred_vehicle_id,
  v.id as vehicle_id,
  v.vehicle_name,
  v.plate_number,
  v.type,
  v.status,
  CASE 
    WHEN v.id IS NULL THEN '❌ VEHICLE NOT FOUND'
    ELSE '✅ Vehicle exists'
  END as result
FROM requests r
LEFT JOIN vehicles v ON v.id = r.preferred_vehicle_id
WHERE r.request_number = 'TO-2025-066';

-- 4. Show what the API should return (simulating the join)
SELECT 
  r.request_number,
  r.title,
  -- Preferred driver (as the API joins it)
  json_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email
  ) as preferred_driver,
  -- Preferred vehicle (as the API joins it)
  json_build_object(
    'id', v.id,
    'vehicle_name', v.vehicle_name,
    'plate_number', v.plate_number,
    'type', v.type
  ) as preferred_vehicle,
  -- Flat fields (as I added in the API)
  u.name as preferred_driver_name,
  v.vehicle_name || ' • ' || v.plate_number as preferred_vehicle_name
FROM requests r
LEFT JOIN users u ON u.id = r.preferred_driver_id
LEFT JOIN vehicles v ON v.id = r.preferred_vehicle_id
WHERE r.request_number = 'TO-2025-066';
