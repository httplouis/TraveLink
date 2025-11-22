-- ============================================
-- CHECK: Foreign Key Schema for preferred_driver_id
-- ============================================

-- 1. Check the foreign key constraint for preferred_driver_id in requests table
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'requests'
  AND kcu.column_name IN ('preferred_driver_id', 'preferred_vehicle_id');

-- 2. Check the data type and nullable status
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name IN ('preferred_driver_id', 'preferred_vehicle_id');

-- 3. Check what's actually stored in TO-2025-066
SELECT 
  request_number,
  preferred_driver_id,
  preferred_vehicle_id,
  -- Try to join with users table
  (SELECT name FROM users WHERE id = preferred_driver_id) as driver_from_users,
  -- Try to join with drivers table
  (SELECT u.name FROM drivers d JOIN users u ON u.id = d.user_id WHERE d.id = preferred_driver_id) as driver_from_drivers_table
FROM requests
WHERE request_number = 'TO-2025-066';
