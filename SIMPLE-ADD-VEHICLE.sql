-- ============================================
-- STEP 1: CHECK VALID VEHICLE TYPE VALUES
-- ============================================
SELECT 
  enumlabel as allowed_vehicle_types
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vehicle_type')
ORDER BY enumsortorder;

-- ============================================
-- STEP 2: ADD ONLY THE REQUIRED VEHICLE
-- ============================================
-- Just add the one vehicle the form needs (use 'van' as safe fallback)
INSERT INTO public.vehicles (
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status
) VALUES 
  ('eac79a97-86c8-4cdf-9f12-9c472223d249', 'Bus 1', 'TL-BUS-001', 'van', 45, 'available')
ON CONFLICT (id) DO UPDATE SET
  vehicle_name = EXCLUDED.vehicle_name,
  capacity = EXCLUDED.capacity;

-- ============================================
-- STEP 3: VERIFY
-- ============================================
SELECT id, vehicle_name, plate_number, type 
FROM public.vehicles 
WHERE id = 'eac79a97-86c8-4cdf-9f12-9c472223d249';

-- ============================================
-- Show me the results of STEP 1 so I can see valid types!
-- ============================================
