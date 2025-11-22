-- ═══════════════════════════════════════════════════════════════════════
-- CREATE HR ACCOUNT: DR. MARIA SYLVIA S. AVILA
-- Director, Human Resource Department
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- NOTE: You need to create this account in Supabase Auth first with email:
--       maria.avila@mseuf.edu.ph (or your preferred email)
--       Then run this script to update the users table with proper role.
--
-- ═══════════════════════════════════════════════════════════════════════

DO $$

DECLARE
  v_hr_dept_id UUID; -- Human Resource Department ID

BEGIN
  -- Get HR Department ID (prefer "Human Resource Department" over "Human Resources")
  SELECT id INTO v_hr_dept_id 
  FROM departments 
  WHERE name = 'Human Resource Department' OR code = 'HRD'
  LIMIT 1;
  
  -- Fallback to "Human Resources" if "Human Resource Department" not found
  IF v_hr_dept_id IS NULL THEN
    SELECT id INTO v_hr_dept_id 
    FROM departments 
    WHERE name ILIKE '%human resource%' OR code IN ('HR', 'HRD', 'HRO')
    LIMIT 1;
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════
  -- HR DIRECTOR: DR. MARIA SYLVIA S. AVILA
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_hr,
    is_head,
    position_title,
    department_id,
    phone,
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'maria.avila@mseuf.edu.ph',
    'DR. MARIA SYLVIA S. AVILA',
    'hr',
    TRUE,
    TRUE, -- Director = Head of Department
    'Director, Human Resource Department',
    COALESCE(v_hr_dept_id, (SELECT id FROM departments WHERE code = 'HRD' LIMIT 1)),
    '+63 917 999 9999',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'maria.avila@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'DR. MARIA SYLVIA S. AVILA',
    role = 'hr',
    is_hr = TRUE,
    is_head = TRUE,
    position_title = 'Director, Human Resource Department',
    department_id = COALESCE(v_hr_dept_id, (SELECT id FROM departments WHERE code = 'HRD' LIMIT 1)),
    is_active = TRUE;

  IF v_hr_dept_id IS NULL THEN
    RAISE WARNING '⚠️ HR Department not found. User created but department_id may be NULL.';
  ELSE
    RAISE NOTICE '✅ HR account created/updated successfully!';
    RAISE NOTICE '   Name: DR. MARIA SYLVIA S. AVILA';
    RAISE NOTICE '   Email: maria.avila@mseuf.edu.ph';
    RAISE NOTICE '   Role: HR Director (is_hr=TRUE, is_head=TRUE)';
    RAISE NOTICE '   Department ID: %', v_hr_dept_id;
  END IF;

END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════
SELECT 
  u.email,
  u.name,
  u.position_title,
  u.role,
  u.is_hr,
  u.is_head,
  u.is_active,
  d.name as department_name,
  d.code as department_code,
  u.created_at
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.email = 'maria.avila@mseuf.edu.ph';

