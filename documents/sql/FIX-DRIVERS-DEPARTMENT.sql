-- ============================================
-- FIX DRIVERS DEPARTMENT - Remove "local" and set to "Transport Office"
-- ============================================

-- Update all drivers with "local" or NULL department to "Transport Office"
UPDATE public.users
SET department = 'Transport Office'
WHERE role = 'driver' 
  AND (department IS NULL OR department = '' OR LOWER(department) = 'local');

-- Verify the update
SELECT 
  id,
  name,
  email,
  role,
  department,
  status
FROM public.users
WHERE role = 'driver'
ORDER BY name;

-- Count drivers by department
SELECT 
  department,
  COUNT(*) as driver_count
FROM public.users
WHERE role = 'driver'
GROUP BY department
ORDER BY driver_count DESC;

