-- ============================================
-- COMPLETE DATABASE SETUP - ONE FILE
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

\echo '================================================'
\echo 'TraviLink Complete Database Setup'
\echo 'This will create all tables and seed data'
\echo '================================================'

-- If you already have the base tables (users, departments, requests), 
-- you can skip to the "ADDITIONAL TABLES" section below

-- ============================================
-- STEP 1: CREATE ADDITIONAL TABLES
-- ============================================

\echo ''
\echo 'Creating vehicles table...'

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  plate_number VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  mileage_km DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);

\echo 'Creating driver_profiles table...'

CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  license_number VARCHAR(100) NOT NULL,
  license_expiry DATE,
  can_drive_types VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],
  is_available BOOLEAN DEFAULT TRUE,
  total_trips INT DEFAULT 0,
  badges VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[],
  phone VARCHAR(50),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_user ON public.driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_available ON public.driver_profiles(is_available);

\echo 'Creating trips table...'

CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  driver_id UUID REFERENCES public.users(id),
  department_id UUID REFERENCES public.departments(id),
  destination VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  trip_date DATE NOT NULL,
  departure_time TIME,
  return_time TIME,
  actual_departure_time TIME,
  actual_return_time TIME,
  status VARCHAR(50) DEFAULT 'scheduled',
  distance_km DECIMAL(10,2),
  fuel_used_liters DECIMAL(10,2),
  starting_mileage DECIMAL(10,2),
  ending_mileage DECIMAL(10,2),
  passenger_count INT DEFAULT 0,
  passenger_names TEXT[],
  driver_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_trip_times CHECK (
    actual_return_time IS NULL OR actual_departure_time IS NULL OR actual_return_time >= actual_departure_time
  )
);

CREATE INDEX IF NOT EXISTS idx_trips_date ON public.trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_request ON public.trips(request_id);

\echo 'Creating feedback table...'

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  user_name VARCHAR(255),
  message TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(50) DEFAULT 'NEW',
  admin_response TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

\echo 'Creating vehicle_maintenance table...'

CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  scheduled_date DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'scheduled',
  performed_by VARCHAR(255),
  mechanic_shop VARCHAR(255),
  parts_replaced TEXT[],
  services_performed TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.vehicle_maintenance(status);

\echo 'Setting up triggers...'

-- Create or replace the update_timestamp function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all new tables
DROP TRIGGER IF EXISTS vehicles_update_timestamp ON public.vehicles;
CREATE TRIGGER vehicles_update_timestamp
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS driver_profiles_update_timestamp ON public.driver_profiles;
CREATE TRIGGER driver_profiles_update_timestamp
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trips_update_timestamp ON public.trips;
CREATE TRIGGER trips_update_timestamp
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS feedback_update_timestamp ON public.feedback;
CREATE TRIGGER feedback_update_timestamp
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS vehicle_maintenance_update_timestamp ON public.vehicle_maintenance;
CREATE TRIGGER vehicle_maintenance_update_timestamp
  BEFORE UPDATE ON public.vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================
-- STEP 2: INSERT SEED DATA
-- ============================================

\echo ''
\echo 'Inserting vehicles...'

INSERT INTO public.vehicles (name, plate_number, type, capacity, status, mileage_km) VALUES
('L300 Van', 'ABC-1234', 'Van', 12, 'available', 45000.00),
('Toyota Hiace', 'DEF-5678', 'Van', 15, 'available', 32000.00),
('Mitsubishi Adventure', 'GHI-9012', 'Van', 7, 'available', 28000.00),
('Nissan Urvan', 'JKL-3456', 'Van', 18, 'available', 55000.00),
('Isuzu Crosswind', 'MNO-7890', 'Van', 8, 'available', 62000.00),
('School Bus 01', 'BUS-0001', 'Bus', 40, 'available', 120000.00),
('School Bus 02', 'BUS-0002', 'Bus', 40, 'available', 95000.00),
('Toyota Fortuner', 'CAR-1111', 'Car', 7, 'available', 38000.00),
('Ford Ranger', 'CAR-2222', 'Car', 5, 'available', 42000.00),
('Mitsubishi Montero', 'CAR-3333', 'Car', 7, 'available', 51000.00)
ON CONFLICT (plate_number) DO NOTHING;

\echo 'Inserting driver users...'

-- Insert driver users
DO $$
DECLARE
  driver1_id UUID;
  driver2_id UUID;
  driver3_id UUID;
  driver4_id UUID;
  driver5_id UUID;
BEGIN
  -- Insert or get driver users
  INSERT INTO public.users (email, name, role, department_id)
  VALUES 
    ('driver.juan@mseuf.edu.ph', 'Juan Dela Cruz', 'driver', NULL),
    ('driver.maria@mseuf.edu.ph', 'Maria Santos', 'driver', NULL),
    ('driver.pedro@mseuf.edu.ph', 'Pedro Reyes', 'driver', NULL),
    ('driver.ana@mseuf.edu.ph', 'Ana Garcia', 'driver', NULL),
    ('driver.roberto@mseuf.edu.ph', 'Roberto Fernandez', 'driver', NULL)
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

  -- Get IDs
  SELECT id INTO driver1_id FROM public.users WHERE email = 'driver.juan@mseuf.edu.ph';
  SELECT id INTO driver2_id FROM public.users WHERE email = 'driver.maria@mseuf.edu.ph';
  SELECT id INTO driver3_id FROM public.users WHERE email = 'driver.pedro@mseuf.edu.ph';
  SELECT id INTO driver4_id FROM public.users WHERE email = 'driver.ana@mseuf.edu.ph';
  SELECT id INTO driver5_id FROM public.users WHERE email = 'driver.roberto@mseuf.edu.ph';

  -- Insert driver profiles
  INSERT INTO public.driver_profiles (
    user_id, 
    license_number, 
    license_expiry, 
    can_drive_types, 
    is_available, 
    total_trips, 
    badges,
    phone
  ) VALUES
    (driver1_id, 'DL-2024-001', '2026-12-31', ARRAY['Van', 'Car'], true, 145, ARRAY['safe_driver', 'veteran'], '0917-123-4567'),
    (driver2_id, 'DL-2024-002', '2027-06-30', ARRAY['Van', 'Bus', 'Car'], true, 98, ARRAY['safe_driver'], '0918-234-5678'),
    (driver3_id, 'DL-2024-003', '2026-09-15', ARRAY['Van'], true, 67, ARRAY[]::VARCHAR[], '0919-345-6789'),
    (driver4_id, 'DL-2024-004', '2027-03-20', ARRAY['Car', 'Van'], true, 112, ARRAY['safe_driver', 'efficient'], '0920-456-7890'),
    (driver5_id, 'DL-2024-005', '2026-11-10', ARRAY['Bus', 'Van'], true, 89, ARRAY['veteran'], '0921-567-8901')
  ON CONFLICT (user_id) DO NOTHING;
  
END $$;

\echo 'Inserting feedback...'

INSERT INTO public.feedback (user_name, message, rating, status, created_at) VALUES
('Ana Santos', 'Love the shuttle schedule view. Can we add a dark mode toggle?', 5, 'NEW', NOW() - INTERVAL '6 days'),
('Registrar Office', 'Sometimes the map pin does not center on mobile.', 3, 'REVIEWED', NOW() - INTERVAL '5 days'),
('John Dela Cruz', 'Please allow exporting request history by department.', 4, 'NEW', NOW() - INTERVAL '4 days'),
('Maintenance', 'UI labels overlap when zoom is 125%.', 2, 'RESOLVED', NOW() - INTERVAL '2 days'),
('HR', 'Add keyboard shortcut to open new feedback form.', 4, 'REVIEWED', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

\echo 'Inserting sample trips...'

-- Insert sample trips
DO $$
DECLARE
  v_van1 UUID;
  v_van2 UUID;
  v_bus1 UUID;
  d_juan UUID;
  d_maria UUID;
  dept_ccms UUID;
  dept_hr UUID;
BEGIN
  -- Get vehicle IDs
  SELECT id INTO v_van1 FROM public.vehicles WHERE plate_number = 'ABC-1234';
  SELECT id INTO v_van2 FROM public.vehicles WHERE plate_number = 'DEF-5678';
  SELECT id INTO v_bus1 FROM public.vehicles WHERE plate_number = 'BUS-0001';
  
  -- Get driver IDs
  SELECT id INTO d_juan FROM public.users WHERE email = 'driver.juan@mseuf.edu.ph';
  SELECT id INTO d_maria FROM public.users WHERE email = 'driver.maria@mseuf.edu.ph';
  
  -- Get department IDs
  SELECT id INTO dept_ccms FROM public.departments WHERE code = 'CCMS' LIMIT 1;
  SELECT id INTO dept_hr FROM public.departments WHERE name ILIKE '%Human Resources%' LIMIT 1;
  
  -- Insert trips
  IF v_van1 IS NOT NULL AND d_juan IS NOT NULL THEN
    INSERT INTO public.trips (
      vehicle_id, 
      driver_id, 
      department_id, 
      destination, 
      purpose, 
      trip_date, 
      departure_time, 
      return_time, 
      status,
      distance_km,
      passenger_count
    ) VALUES
      (v_van1, d_juan, dept_ccms, 'CHED Region IV-A', 'Official Meeting', CURRENT_DATE + INTERVAL '2 days', '08:00', '17:00', 'scheduled', 45.5, 8),
      (v_van2, d_maria, dept_hr, 'UP Diliman', 'Seminar', CURRENT_DATE + INTERVAL '5 days', '07:30', '18:00', 'scheduled', 112.0, 12),
      (v_bus1, d_juan, dept_ccms, 'Batangas Pier', 'Educational Tour', CURRENT_DATE + INTERVAL '10 days', '06:00', '20:00', 'scheduled', 85.0, 35)
    ON CONFLICT DO NOTHING;
  END IF;
  
END $$;

-- ============================================
-- STEP 3: DISABLE RLS FOR TESTING (OPTIONAL)
-- ============================================
-- Uncomment these if you want to test without RLS policies

-- ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.driver_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vehicle_maintenance DISABLE ROW LEVEL SECURITY;

-- ============================================
-- DONE! Show Summary
-- ============================================

\echo ''
\echo '================================================'
\echo 'Setup Complete! Summary:'
\echo '================================================'

SELECT 'Vehicles' as table_name, COUNT(*) as count FROM public.vehicles
UNION ALL
SELECT 'Driver Profiles' as table_name, COUNT(*) as count FROM public.driver_profiles
UNION ALL
SELECT 'Feedback' as table_name, COUNT(*) as count FROM public.feedback
UNION ALL
SELECT 'Trips' as table_name, COUNT(*) as count FROM public.trips;

\echo ''
\echo '✅ All tables created and seeded!'
\echo ''
\echo 'Next steps:'
\echo '1. Test API endpoints: /api/vehicles, /api/drivers, /api/trips'
\echo '2. Navigate to /user/request and select "Institutional" mode'
\echo '3. Check if dropdowns load drivers and vehicles from database'
\echo ''
\echo 'Need help? Check MIGRATION-TO-SUPABASE.md for detailed guide'
\echo ''
