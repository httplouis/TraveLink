-- ============================================
-- CHECK VEHICLES TABLE
-- ============================================

-- Check all existing vehicles
SELECT 
  id,
  vehicle_name,
  plate_number,
  type,
  status
FROM public.vehicles
ORDER BY vehicle_name;

-- Check if the specific vehicle exists
SELECT * FROM public.vehicles 
WHERE id = 'eac79a97-86c8-4cdf-9f12-9c472223d249';

-- If it doesn't exist, create it
INSERT INTO public.vehicles (
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status
) VALUES (
  'eac79a97-86c8-4cdf-9f12-9c472223d249',
  'Bus 1',
  'MSE-001',
  'bus',
  45,
  'available'
) ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT * FROM public.vehicles 
WHERE id = 'eac79a97-86c8-4cdf-9f12-9c472223d249';

-- ============================================
-- After running, try submitting the request again
-- ============================================
