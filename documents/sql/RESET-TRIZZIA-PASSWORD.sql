-- ============================================
-- RESET TRIZZIA PASSWORD VIA SQL
-- ============================================

-- Update password to: Trizzia@2024
UPDATE auth.users
SET 
  encrypted_password = crypt('Trizzia@2024', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  updated_at,
  role
FROM auth.users
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ NEW CREDENTIALS
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024
-- 
-- Try logging in now!
