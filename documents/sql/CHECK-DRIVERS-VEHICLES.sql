-- ============================================
-- CHECK DRIVERS AND VEHICLES
-- ============================================

-- Step 1: Check if Pedro Reyes exists in drivers table
SELECT 
  id,
  name,
  email,
  license_number,
  status
FROM drivers
WHERE name ILIKE '%Pedro%' OR name ILIKE '%Reyes%'
ORDER BY name;

-- Step 2: Check if Bus 1 / MSE-001 exists in vehicles table
SELECT 
  id,
  vehicle_name,
  plate_number,
  vehicle_type,
  status
FROM vehicles
WHERE plate_number = 'MSE-001' 
   OR vehicle_name ILIKE '%Bus 1%'
ORDER BY vehicle_name;

-- Step 3: List ALL available drivers
SELECT 
  id,
  name,
  email,
  license_number,
  status
FROM drivers
ORDER BY name;

-- Step 4: List ALL available vehicles
SELECT 
  id,
  vehicle_name,
  plate_number,
  vehicle_type,
  status
FROM vehicles
ORDER BY vehicle_name;

-- ============================================
-- If driver/vehicle don't exist, we need to:
-- Option 1: Add them to database
-- Option 2: Make the fields nullable (optional)
-- ============================================
