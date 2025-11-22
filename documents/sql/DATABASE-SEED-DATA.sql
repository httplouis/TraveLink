-- ============================================
-- SEED DATA FOR TRAVILINK SYSTEM
-- Initial data for vehicles, drivers, feedback, etc.
-- ============================================

\echo 'Seeding vehicles...'

-- Insert Vehicles
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

\echo 'Seeding driver profiles...'

-- First, create driver users if they don't exist
-- Note: These should match the users table
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
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO driver1_id;

  -- Get IDs of all drivers
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

\echo 'Seeding feedback...'

-- Insert Sample Feedback
INSERT INTO public.feedback (user_name, message, rating, status, created_at) VALUES
('Ana Santos', 'Love the shuttle schedule view. Can we add a dark mode toggle?', 5, 'NEW', NOW() - INTERVAL '6 days'),
('Registrar Office', 'Sometimes the map pin does not center on mobile.', 3, 'REVIEWED', NOW() - INTERVAL '5 days'),
('John Dela Cruz', 'Please allow exporting request history by department.', 4, 'NEW', NOW() - INTERVAL '4 days'),
('Maintenance', 'UI labels overlap when zoom is 125%.', 2, 'RESOLVED', NOW() - INTERVAL '2 days'),
('HR', 'Add keyboard shortcut to open new feedback form.', 4, 'REVIEWED', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

\echo 'Seeding sample trips...'

-- Insert Sample Trips (using existing vehicles and drivers)
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
  
END $$;

\echo 'Seed data inserted successfully!'

-- Show summary
SELECT 'Vehicles' as table_name, COUNT(*) as count FROM public.vehicles
UNION ALL
SELECT 'Driver Profiles' as table_name, COUNT(*) as count FROM public.driver_profiles
UNION ALL
SELECT 'Feedback' as table_name, COUNT(*) as count FROM public.feedback
UNION ALL
SELECT 'Trips' as table_name, COUNT(*) as count FROM public.trips;
