-- ============================================
-- SEED DRIVERS AND VEHICLES DATA
-- Based on provided lists
-- ============================================

-- First, ensure we have users for drivers (or create placeholder users)
-- Then create driver_profiles entries
-- Then seed vehicles with coding days

-- ============================================
-- 1. CREATE DRIVER USERS (if they don't exist)
-- ============================================
-- Note: These are placeholder users. In production, drivers should have real accounts
-- For now, we'll create minimal user records

INSERT INTO public.users (id, name, email, role, status, created_at)
VALUES
  (gen_random_uuid(), 'CALVENDRA, JORGE', 'jorge.calvendra@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'HERNANDEZ, CARLOS', 'carlos.hernandez@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'MACARAIG, ALEX', 'alex.macaraig@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'ORTIZ, CARMELO', 'carmelo.ortiz@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'PABELLAR, JONATHAN', 'jonathan.pabellar@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'RENIGADO, DANTE', 'dante.renigado@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'SABIDA, EDSEL', 'edsel.sabida@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'VILLANO, ERNESTO', 'ernesto.villano@mseuf.edu.ph', 'driver', 'active', NOW()),
  (gen_random_uuid(), 'ZURBANO, MANUEL', 'manuel.zurbano@mseuf.edu.ph', 'driver', 'active', NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. CREATE DRIVER PROFILES
-- ============================================
-- Note: This assumes the drivers table structure from the schema
-- Adjust based on your actual drivers table structure

DO $$
DECLARE
  driver_rec RECORD;
  driver_user_id UUID;
BEGIN
  FOR driver_rec IN 
    SELECT id, name FROM public.users WHERE role = 'driver' AND name IN (
      'CALVENDRA, JORGE', 'HERNANDEZ, CARLOS', 'MACARAIG, ALEX', 
      'ORTIZ, CARMELO', 'PABELLAR, JONATHAN', 'RENIGADO, DANTE',
      'SABIDA, EDSEL', 'VILLANO, ERNESTO', 'ZURBANO, MANUEL'
    )
  LOOP
    -- Insert into drivers table (adjust columns based on your schema)
    INSERT INTO public.drivers (user_id, license_no, license_expiry, driver_rating, phone)
    VALUES (
      driver_rec.id,
      'DL-' || UPPER(SUBSTRING(REPLACE(driver_rec.name, ' ', ''), 1, 8)),
      (CURRENT_DATE + INTERVAL '2 years')::DATE,
      5.0,
      '+63' || LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT, 10, '0')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 3. SEED VEHICLES WITH CODING DAYS
-- ============================================
-- Based on the SCHOOL SERVICE document:
-- Vehicles with their plate numbers, capacities, and assigned days

-- Create a table to track vehicle coding days
CREATE TABLE IF NOT EXISTS public.vehicle_coding_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  coding_day TEXT NOT NULL CHECK (coding_day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, coding_day)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_coding_days_vehicle ON public.vehicle_coding_days(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_coding_days_day ON public.vehicle_coding_days(coding_day);

-- Insert vehicles
INSERT INTO public.vehicles (plate_number, vehicle_name, type, capacity, status, created_at)
VALUES
  ('CAQ5881', 'VOLVO BUS', 'bus', 49, 'available', NOW()),
  ('AAX3122', 'INNOVA RED', 'car', 7, 'available', NOW()),
  ('NEI1691', 'INNOVA WHITE', 'car', 7, 'available', NOW()),
  ('VDF192', 'DAEWOO BUS', 'bus', 49, 'available', NOW()),
  ('NHR6192', 'TOYOTA ZENIX', 'car', 7, 'available', NOW()),
  ('NJE3823', 'TOYOTA COASTER', 'van', 25, 'available', NOW()),
  ('NFQ4545', 'INNOVA BLACKISH RED', 'car', 7, 'available', NOW()),
  ('UQY976', 'MAXIMA BUS', 'bus', 40, 'available', NOW()),
  ('DBR6007', 'INNOVA SILVER', 'car', 7, 'available', NOW()),
  ('NEP8737', 'ISUZU TRAVIS', 'van', 15, 'available', NOW()),
  ('NAA8577', 'TOYOTA GRANDIA', 'van', 15, 'available', NOW()),
  ('NCI1607', 'NEW ROSA', 'bus', 27, 'available', NOW()),
  ('PZQ487', 'STAREX GOLD', 'van', 12, 'available', NOW()),
  ('DAL6569', 'ISUZU ELF', 'van', 15, 'available', NOW()),
  ('WBW349', 'OLD ROSA', 'bus', 25, 'available', NOW())
ON CONFLICT (plate_number) DO UPDATE SET
  vehicle_name = EXCLUDED.vehicle_name,
  type = EXCLUDED.type,
  capacity = EXCLUDED.capacity;

-- Insert coding days based on the schedule
-- Monday vehicles
INSERT INTO public.vehicle_coding_days (vehicle_id, coding_day)
SELECT v.id, 'Monday'
FROM public.vehicles v
WHERE v.plate_number IN ('CAQ5881', 'AAX3122', 'NEI1691', 'VDF192')
ON CONFLICT (vehicle_id, coding_day) DO NOTHING;

-- Tuesday vehicles
INSERT INTO public.vehicle_coding_days (vehicle_id, coding_day)
SELECT v.id, 'Tuesday'
FROM public.vehicles v
WHERE v.plate_number IN ('NHR6192', 'NJE3823')
ON CONFLICT (vehicle_id, coding_day) DO NOTHING;

-- Wednesday vehicles
INSERT INTO public.vehicle_coding_days (vehicle_id, coding_day)
SELECT v.id, 'Wednesday'
FROM public.vehicles v
WHERE v.plate_number IN ('NFQ4545', 'UQY976')
ON CONFLICT (vehicle_id, coding_day) DO NOTHING;

-- Thursday vehicles
INSERT INTO public.vehicle_coding_days (vehicle_id, coding_day)
SELECT v.id, 'Thursday'
FROM public.vehicles v
WHERE v.plate_number IN ('DBR6007', 'NEP8737', 'NAA8577', 'NCI1607', 'PZQ487')
ON CONFLICT (vehicle_id, coding_day) DO NOTHING;

-- Friday vehicles
INSERT INTO public.vehicle_coding_days (vehicle_id, coding_day)
SELECT v.id, 'Friday'
FROM public.vehicles v
WHERE v.plate_number IN ('DAL6569', 'WBW349')
ON CONFLICT (vehicle_id, coding_day) DO NOTHING;

-- ============================================
-- 4. CREATE FUNCTION TO CHECK VEHICLE AVAILABILITY
-- ============================================
CREATE OR REPLACE FUNCTION is_vehicle_available(
  p_vehicle_id UUID,
  p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_coding_day TEXT;
  v_day_of_week TEXT;
  v_is_coding_day BOOLEAN := FALSE;
  v_is_assigned BOOLEAN := FALSE;
BEGIN
  -- Get day of week
  v_day_of_week := TO_CHAR(p_date, 'Day');
  v_day_of_week := TRIM(v_day_of_week);
  
  -- Check if it's a coding day
  SELECT EXISTS(
    SELECT 1 FROM public.vehicle_coding_days
    WHERE vehicle_id = p_vehicle_id
    AND coding_day = v_day_of_week
  ) INTO v_is_coding_day;
  
  -- Check if vehicle is already assigned on this date
  SELECT EXISTS(
    SELECT 1 FROM public.requests r
    WHERE r.assigned_vehicle_id = p_vehicle_id
    AND r.status NOT IN ('rejected', 'cancelled')
    AND DATE(r.travel_start_date) <= p_date
    AND DATE(r.travel_end_date) >= p_date
  ) INTO v_is_assigned;
  
  -- Vehicle is available if:
  -- 1. It's NOT a coding day, OR
  -- 2. It's a coding day but the last digit of plate doesn't match coding restriction
  -- 3. AND it's not already assigned
  RETURN NOT v_is_coding_day AND NOT v_is_assigned;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_vehicle_available IS 'Checks if a vehicle is available on a given date, considering coding days and existing assignments';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the data:

-- SELECT v.plate_number, v.vehicle_name, v.type, v.capacity, vcd.coding_day
-- FROM public.vehicles v
-- LEFT JOIN public.vehicle_coding_days vcd ON v.id = vcd.vehicle_id
-- ORDER BY vcd.coding_day, v.plate_number;

-- SELECT u.name, d.license_no, d.license_expiry
-- FROM public.users u
-- JOIN public.drivers d ON u.id = d.user_id
-- WHERE u.role = 'driver'
-- ORDER BY u.name;

