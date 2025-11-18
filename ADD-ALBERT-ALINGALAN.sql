-- ═══════════════════════════════════════════════════════════════════════
-- ADD ALBERT D. ALINGALAN - Financial Analyst
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- Kapantay ni Audrey (same level)
-- Staff sa Comptroller Office
-- Can receive comptroller requests
--
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Create account in Supabase Auth first
-- Go to: https://supabase.com/dashboard → Authentication → Users → Add User
-- Email: albert.alingalan@mseuf.edu.ph
-- Password: Albert2024!
-- ✅ Check "Auto Confirm User"

-- Step 2: Run this SQL after creating in Auth
DO $$
DECLARE
  v_comptroller_dept_id UUID := '24033a9b-cd26-465a-ac90-406d4b0b4358'; -- Office of the Comptroller
BEGIN
  -- Insert/update Albert's account
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    position_title,
    department_id,
    phone,
    is_active,
    is_comptroller,
    created_at
  )
  SELECT 
    au.id,
    'albert.alingalan@mseuf.edu.ph',
    'Albert D. Alingalan',
    'comptroller',
    'Financial Analyst',
    v_comptroller_dept_id,
    '+63 917 666 6667',
    TRUE,
    TRUE, -- is_comptroller = TRUE (can receive requests)
    NOW()
  FROM auth.users au
  WHERE au.email = 'albert.alingalan@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Albert D. Alingalan',
    role = 'comptroller',
    position_title = 'Financial Analyst',
    department_id = v_comptroller_dept_id,
    is_comptroller = TRUE;

  -- Set parent to Comptroller
  UPDATE public.users
  SET parent_id = (SELECT id FROM users WHERE email = 'comptroller@mseuf.edu.ph')
  WHERE email = 'albert.alingalan@mseuf.edu.ph';

  RAISE NOTICE '✅ Albert D. Alingalan account created/updated successfully!';
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT 
  u.email,
  u.name,
  u.position_title,
  u.role,
  u.is_comptroller,
  parent.name as parent_name
FROM users u
LEFT JOIN users parent ON u.parent_id = parent.id
WHERE u.email = 'albert.alingalan@mseuf.edu.ph';

