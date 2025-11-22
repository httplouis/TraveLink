-- ============================================
-- FIND CORRECT VEHICLE ID
-- ============================================

-- Find vehicle with plate MSE-001
SELECT 
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status
FROM public.vehicles
WHERE plate_number = 'MSE-001' OR vehicle_name LIKE '%Bus 1%';

-- Show all vehicles for reference
SELECT 
  id,
  vehicle_name,
  plate_number,
  type
FROM public.vehicles
ORDER BY vehicle_name;

-- ============================================
-- The ID shown above is what should be used in the form
-- ============================================
