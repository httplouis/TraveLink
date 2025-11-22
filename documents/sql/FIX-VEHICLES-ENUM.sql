-- ============================================
-- CHECK VEHICLE TYPE ENUM VALUES
-- ============================================

-- Check what vehicle_type enum values are allowed
SELECT 
  enumlabel as allowed_value
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'vehicle_type'
)
ORDER BY enumsortorder;

-- ============================================
-- ADD VEHICLES WITH VALID ENUM VALUES
-- ============================================

-- Insert the vehicle ID that the form expects
INSERT INTO public.vehicles (
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status
) VALUES 
  ('eac79a97-86c8-4cdf-9f12-9c472223d249', 'Bus 1', 'TL-BUS-001', 'bus', 45, 'available')
ON CONFLICT (id) DO UPDATE SET
  vehicle_name = EXCLUDED.vehicle_name,
  capacity = EXCLUDED.capacity;

-- Add more test vehicles (using only valid enum values)
INSERT INTO public.vehicles (
  vehicle_name,
  plate_number,
  type,
  capacity,
  status
) VALUES 
  ('Van 1', 'TL-VAN-001', 'van', 12, 'available'),
  ('Van 2', 'TL-VAN-002', 'van', 12, 'available'),
  ('SUV 1', 'TL-SUV-001', 'suv', 7, 'available'),
  ('Bus 2', 'TL-BUS-002', 'bus', 50, 'available')
ON CONFLICT (plate_number) DO NOTHING;

-- Show all vehicles
SELECT 
  id,
  vehicle_name,
  plate_number,
  type,
  capacity,
  status
FROM public.vehicles
ORDER BY vehicle_name;

-- ============================================
-- ✅ Done! Try submitting the request now
-- ============================================
