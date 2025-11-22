-- Check if vehicle_mode column exists and has data
SELECT 
  id,
  request_number,
  vehicle_mode,
  needs_rental,
  needs_vehicle,
  created_at
FROM public.requests
ORDER BY created_at DESC
LIMIT 20;

-- Count how many have vehicle_mode set
SELECT 
  vehicle_mode,
  COUNT(*) as count
FROM public.requests
GROUP BY vehicle_mode;
