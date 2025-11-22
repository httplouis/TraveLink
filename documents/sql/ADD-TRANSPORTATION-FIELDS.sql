-- ═══════════════════════════════════════════════════════════════════════
-- ADD TRANSPORTATION & PROFILE FIELDS - WOW FACTOR COMPLETE
-- TraviLink v2.1 - Revolutionary Complete System
-- ═══════════════════════════════════════════════════════════════════════

-- Transportation fields for requests
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS transportation_type TEXT CHECK (transportation_type IN ('pickup', 'self')),
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS pickup_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS pickup_location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS pickup_time TIME,
ADD COLUMN IF NOT EXISTS pickup_contact_number TEXT,
ADD COLUMN IF NOT EXISTS pickup_special_instructions TEXT,
ADD COLUMN IF NOT EXISTS return_transportation_same BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dropoff_location TEXT,
ADD COLUMN IF NOT EXISTS dropoff_time TIME,
ADD COLUMN IF NOT EXISTS parking_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS own_vehicle_details TEXT;

-- Profile enhancements for users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;

-- Executive role distinction (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'exec_type'
    ) THEN
        ALTER TABLE users ADD COLUMN exec_type TEXT CHECK (exec_type IN ('vp', 'president'));
    END IF;
END $$;

-- Department hierarchy (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'department_type'
    ) THEN
        ALTER TABLE departments 
        ADD COLUMN department_type TEXT CHECK (department_type IN ('college', 'office', 'unit')),
        ADD COLUMN requires_parent_approval BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_transportation_type ON requests(transportation_type);
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);
CREATE INDEX IF NOT EXISTS idx_users_online_status ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_departments_type ON departments(department_type);

-- Sample data updates
UPDATE users SET exec_type = 'vp' WHERE email = 'comptroller@mseuf.edu.ph' AND exec_type IS NULL;
UPDATE users SET exec_type = 'president' WHERE email LIKE '%president%' AND exec_type IS NULL;

-- Verification
SELECT 'Transportation & Profile fields added successfully! 🚀' as status;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN profile_picture IS NOT NULL THEN 1 END) as with_photos,
  COUNT(CASE WHEN exec_type IS NOT NULL THEN 1 END) as executives
FROM users;

SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN transportation_type IS NOT NULL THEN 1 END) as with_transport
FROM requests;
