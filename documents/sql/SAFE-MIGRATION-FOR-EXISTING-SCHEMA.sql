-- ============================================
-- SAFE MIGRATION - Works with Your Existing Schema
-- This adds data to your EXISTING tables
-- NO new table creation, NO conflicts
-- ============================================

-- ================================================
-- Safe Migration for Existing TraviLink Schema
-- This will add sample data to existing tables
-- ================================================

-- ============================================
-- STEP 1: Insert Sample Vehicles
-- ============================================

-- Inserting sample vehicles into existing vehicles table...

-- First, check what vehicle types are valid in your enum
-- Run this query separately to see valid values:
-- SELECT unnest(enum_range(NULL::vehicle_type));

-- Using only SAFE values that are likely in your enum
INSERT INTO public.vehicles (vehicle_name, plate_number, type, capacity, status, notes) VALUES
('L300 Van', 'ABC-1234', 'van', 12, 'available', 'Primary transport vehicle'),
('Toyota Hiace', 'DEF-5678', 'van', 15, 'available', 'Large capacity van'),
('Mitsubishi Adventure', 'GHI-9012', 'van', 7, 'available', 'Compact van'),
('Nissan Urvan', 'JKL-3456', 'van', 18, 'available', 'High capacity van'),
('Isuzu Crosswind', 'MNO-7890', 'van', 8, 'available', 'Standard van'),
('School Bus 01', 'BUS-0001', 'bus', 40, 'available', 'Main school bus'),
('School Bus 02', 'BUS-0002', 'bus', 40, 'available', 'Secondary school bus')
-- Removed SUV and pickup entries - these types might not exist in your enum
-- Add them manually after checking valid enum values
ON CONFLICT (plate_number) DO NOTHING;

-- Vehicles inserted successfully!

-- ============================================
-- STEP 2: Insert Sample Driver Users
-- ============================================

-- Inserting driver users...

DO $$
DECLARE
  driver1_id UUID;
  driver2_id UUID;
  driver3_id UUID;
  driver4_id UUID;
  driver5_id UUID;
BEGIN
  -- Insert driver users into users table
  INSERT INTO public.users (name, email, role, department, status)
  VALUES 
    ('Juan Dela Cruz', 'driver.juan@mseuf.edu.ph', 'driver', 'Transport Office', 'active'),
    ('Maria Santos', 'driver.maria@mseuf.edu.ph', 'driver', 'Transport Office', 'active'),
    ('Pedro Reyes', 'driver.pedro@mseuf.edu.ph', 'driver', 'Transport Office', 'active'),
    ('Ana Garcia', 'driver.ana@mseuf.edu.ph', 'driver', 'Transport Office', 'active'),
    ('Roberto Fernandez', 'driver.roberto@mseuf.edu.ph', 'driver', 'Transport Office', 'active')
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'driver';

  -- Get driver IDs
  SELECT id INTO driver1_id FROM public.users WHERE email = 'driver.juan@mseuf.edu.ph';
  SELECT id INTO driver2_id FROM public.users WHERE email = 'driver.maria@mseuf.edu.ph';
  SELECT id INTO driver3_id FROM public.users WHERE email = 'driver.pedro@mseuf.edu.ph';
  SELECT id INTO driver4_id FROM public.users WHERE email = 'driver.ana@mseuf.edu.ph';
  SELECT id INTO driver5_id FROM public.users WHERE email = 'driver.roberto@mseuf.edu.ph';

  -- Insert into drivers table with license info
  INSERT INTO public.drivers (user_id, license_no, license_expiry, driver_rating) VALUES
    (driver1_id, 'DL-2024-001', '2026-12-31', 4.8),
    (driver2_id, 'DL-2024-002', '2027-06-30', 4.9),
    (driver3_id, 'DL-2024-003', '2026-09-15', 4.5),
    (driver4_id, 'DL-2024-004', '2027-03-20', 4.7),
    (driver5_id, 'DL-2024-005', '2026-11-10', 4.6)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Driver users and profiles created successfully!';
END $$;

-- ============================================
-- STEP 3: Verify Data Insertion
-- ============================================

-- ================================================
-- Data Insertion Complete! Summary:
-- ================================================

SELECT 'Vehicles' as table_name, COUNT(*) as count FROM public.vehicles
UNION ALL
SELECT 'Drivers (users)' as table_name, COUNT(*) as count FROM public.users WHERE role = 'driver'
UNION ALL
SELECT 'Drivers (profiles)' as table_name, COUNT(*) as count FROM public.drivers;

-- ================================================
-- ✅ Safe migration complete!
-- 
-- What was added:
-- - 7 vehicles (5 vans + 2 buses) with plate numbers
-- - 5 driver users with email accounts
-- - 5 driver profiles with license info
-- 
-- NOTE: SUV and pickup vehicles were removed because they may not
--       be valid values in your vehicle_type enum.
--       Check valid enum values with: SELECT unnest(enum_range(NULL::vehicle_type));
-- 
-- Next: Test the API routes at /api/vehicles and /api/drivers
-- ================================================
