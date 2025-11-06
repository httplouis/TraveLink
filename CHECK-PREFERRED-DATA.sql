-- ========================================
-- CHECK IF PREFERRED DRIVER/VEHICLE DATA EXISTS
-- ========================================

-- Check if columns exist in requests table
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name IN (
    'preferred_driver_id',
    'preferred_vehicle_id',
    'submitted_by_name',
    'is_representative'
  )
ORDER BY column_name;

-- Check actual data in recent requests
SELECT 
  id,
  request_number,
  requester_name,
  submitted_by_name,
  is_representative,
  preferred_driver_id,
  preferred_vehicle_id,
  created_at
FROM requests
ORDER BY created_at DESC
LIMIT 5;

-- Count how many requests have preferences
SELECT 
  COUNT(*) as total_requests,
  COUNT(preferred_driver_id) as has_driver_pref,
  COUNT(preferred_vehicle_id) as has_vehicle_pref,
  COUNT(submitted_by_name) as has_submitter
FROM requests;
