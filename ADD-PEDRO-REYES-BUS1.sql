-- ============================================
-- ADD PEDRO REYES DRIVER AND BUS 1 VEHICLE
-- ============================================

-- Step 1: Check if Pedro Reyes already exists
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  d.license_no
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.email = 'pedro.reyes@mseuf.edu.ph';

-- Step 2: Check if Bus 1 / MSE-001 already exists
SELECT 
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status
FROM vehicles 
WHERE plate_number = 'MSE-001' OR vehicle_name ILIKE '%Bus 1%';

-- ============================================
-- Step 3: ADD PEDRO REYES (if not exists)
-- ============================================

-- First, add to users table (required by drivers FK)
INSERT INTO users (
  name,
  email,
  role,
  department_id,
  status,
  is_active,
  created_at
)
SELECT
  'Pedro Reyes',
  'pedro.reyes@mseuf.edu.ph',
  'driver',
  (SELECT id FROM departments WHERE name = 'College of Nursing and Allied Health Sciences' LIMIT 1),
  'active',
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'pedro.reyes@mseuf.edu.ph'
);

-- Then, add to drivers table (references users.id)
INSERT INTO drivers (
  user_id,
  license_no,
  license_expiry,
  phone
)
SELECT
  u.id,
  'N01-12-345678',
  '2026-12-31',
  '09123456789'
FROM users u
WHERE u.email = 'pedro.reyes@mseuf.edu.ph'
  AND NOT EXISTS (
    SELECT 1 FROM drivers d WHERE d.user_id = u.id
  );

-- ============================================
-- Step 4: ADD BUS 1 • MSE-001 (if not exists)
-- ============================================

INSERT INTO vehicles (
  vehicle_name,
  plate_number,
  type,
  capacity,
  status,
  created_at,
  updated_at
)
SELECT
  'Bus 1',
  'MSE-001',
  'bus',
  45,
  'available',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM vehicles WHERE plate_number = 'MSE-001'
);

-- ============================================
-- Step 5: Verify they were added
-- ============================================

-- Check Pedro Reyes (user + driver)
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  d.license_no,
  d.phone,
  '✅ Added to users + drivers' as result
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.email = 'pedro.reyes@mseuf.edu.ph';

-- Check Bus 1
SELECT 
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status,
  '✅ Added' as result
FROM vehicles 
WHERE plate_number = 'MSE-001';

-- ============================================
-- ✅ DONE! Pedro Reyes and Bus 1 now available!
-- ============================================
