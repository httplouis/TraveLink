-- ============================================================================
-- Update Dave Gomez Driver Phone Number
-- ============================================================================

-- Check current driver phone numbers
SELECT 
  id, 
  name, 
  email,
  phone_number,
  contact_number,
  role
FROM users 
WHERE role = 'driver'
ORDER BY name;

-- Update Dave Gomez's phone number
UPDATE users 
SET 
  phone_number = '09935583858',
  contact_number = '09935583858',
  updated_at = NOW()
WHERE name ILIKE '%dave%gomez%' 
  AND role = 'driver';

-- Verify update
SELECT 
  id, 
  name, 
  email,
  phone_number,
  contact_number,
  role
FROM users 
WHERE name ILIKE '%dave%gomez%' 
  AND role = 'driver';

-- If Dave Gomez doesn't exist, you may need to create/assign driver role first
-- Check if user exists without driver role
SELECT 
  id, 
  name, 
  email,
  phone_number,
  role
FROM users 
WHERE name ILIKE '%dave%gomez%';

