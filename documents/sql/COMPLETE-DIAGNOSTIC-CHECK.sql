-- ========================================
-- COMPLETE DIAGNOSTIC CHECK
-- Run this to see EXACTLY what's wrong
-- ========================================

-- STEP 1: Check if columns exist
SELECT 
  '✅ COLUMN CHECK' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name IN (
    'preferred_driver_id',
    'preferred_vehicle_id', 
    'submitted_by_user_id',
    'submitted_by_name',
    'is_representative'
  )
ORDER BY column_name;

-- If above returns 0 rows, RUN THE MIGRATIONS!

-- STEP 2: Check actual request data
SELECT 
  '📊 DATA CHECK' as check_type,
  request_number,
  requester_name,
  submitted_by_name,
  is_representative,
  preferred_driver_id,
  preferred_vehicle_id,
  status,
  created_at
FROM requests
WHERE status IN ('pending_head', 'pending_parent_head')
ORDER BY created_at DESC
LIMIT 5;

-- STEP 3: Count requests with preferences
SELECT
  '📈 STATISTICS' as check_type,
  COUNT(*) as total_requests,
  COUNT(preferred_driver_id) as has_driver_preference,
  COUNT(preferred_vehicle_id) as has_vehicle_preference,
  COUNT(CASE WHEN preferred_driver_id IS NOT NULL OR preferred_vehicle_id IS NOT NULL THEN 1 END) as has_any_preference
FROM requests
WHERE status IN ('pending_head', 'pending_parent_head');

-- STEP 4: Check if Gal Gadot request has preferences
SELECT
  '🎬 GAL GADOT CHECK' as check_type,
  request_number,
  requester_name,
  preferred_driver_id,
  preferred_vehicle_id,
  submitted_by_name,
  is_representative,
  created_at
FROM requests
WHERE requester_name = 'Gal Gadot'
ORDER BY created_at DESC
LIMIT 1;

-- STEP 5: Show all columns in requests table
SELECT 
  '📋 ALL COLUMNS' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'requests'
ORDER BY ordinal_position;
