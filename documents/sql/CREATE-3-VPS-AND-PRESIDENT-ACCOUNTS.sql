-- ═══════════════════════════════════════════════════════════════════════
-- CREATE 3 VPs AND 1 PRESIDENT ACCOUNTS
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- This script creates accounts for:
-- 1. VP for Academics and Research
-- 2. VP for Administration  
-- 3. VP for External Relations
-- 4. President/COO
--
-- NOTE: You need to create these accounts in Supabase Auth first,
-- then run this script to update the users table with proper roles.
--
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Get department IDs
DO $$
DECLARE
  v_vpar_dept_id UUID := '2ccc7696-ebd7-4866-9edc-9cdf280149ff'; -- OVPAR
  v_vpa_dept_id UUID := '5d0e7a08-9198-4209-85d6-8d73e2b80d7e'; -- OVPA
  v_vper_dept_id UUID := '1c69bf47-1c43-4652-baba-b8a5388f667d'; -- OVPER
  v_president_dept_id UUID := '398e97fd-191f-4f1a-95ad-2e32c429c0ef'; -- OPCOO
BEGIN
  -- Verify department IDs exist (optional check)
  IF NOT EXISTS (SELECT 1 FROM departments WHERE id = v_vpar_dept_id) THEN
    SELECT id INTO v_vpar_dept_id FROM departments WHERE code = 'OVPAR' LIMIT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM departments WHERE id = v_vpa_dept_id) THEN
    SELECT id INTO v_vpa_dept_id FROM departments WHERE code = 'OVPA' LIMIT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM departments WHERE id = v_vper_dept_id) THEN
    SELECT id INTO v_vper_dept_id FROM departments WHERE code = 'OVPER' LIMIT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM departments WHERE id = v_president_dept_id) THEN
    SELECT id INTO v_president_dept_id FROM departments WHERE code = 'OPCOO' LIMIT 1;
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════
  -- VP 1: VP for Academics and Research
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_vp,
    is_president,
    exec_type,
    position_title,
    department_id,
    phone,
    active,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    'vp.academics@mseuf.edu.ph',
    'Dr. Roselle Garcia',
    'exec',
    TRUE,
    FALSE,
    'vp',
    'Vice President for Academics and Research',
    v_vpar_dept_id,
    '+63 917 111 1111',
    TRUE,
    NOW(),
    NOW()
  FROM auth.users au
  WHERE au.email = 'vp.academics@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    is_vp = TRUE,
    is_president = FALSE,
    exec_type = 'vp',
    position_title = 'Vice President for Academics and Research',
    department_id = v_vpar_dept_id,
    updated_at = NOW();

  -- ═══════════════════════════════════════════════════════════════════════
  -- VP 2: VP for Administration
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_vp,
    is_president,
    exec_type,
    position_title,
    department_id,
    phone,
    active,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    'vp.admin@mseuf.edu.ph',
    'Mr. Rene Garcia',
    'exec',
    TRUE,
    FALSE,
    'vp',
    'Vice President for Administration',
    v_vpa_dept_id,
    '+63 917 222 2222',
    TRUE,
    NOW(),
    NOW()
  FROM auth.users au
  WHERE au.email = 'vp.admin@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    is_vp = TRUE,
    is_president = FALSE,
    exec_type = 'vp',
    position_title = 'Vice President for Administration',
    department_id = v_vpa_dept_id,
    updated_at = NOW();

  -- ═══════════════════════════════════════════════════════════════════════
  -- VP 3: VP for External Relations
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_vp,
    is_president,
    exec_type,
    position_title,
    department_id,
    phone,
    active,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    'vp.external@mseuf.edu.ph',
    'Mr. Paolo Miranda',
    'exec',
    TRUE,
    FALSE,
    'vp',
    'Vice President for External Relations',
    v_vper_dept_id,
    '+63 917 333 3333',
    TRUE,
    NOW(),
    NOW()
  FROM auth.users au
  WHERE au.email = 'vp.external@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    is_vp = TRUE,
    is_president = FALSE,
    exec_type = 'vp',
    position_title = 'Vice President for External Relations',
    department_id = v_vper_dept_id,
    updated_at = NOW();

  -- ═══════════════════════════════════════════════════════════════════════
  -- PRESIDENT: President/COO
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_vp,
    is_president,
    exec_type,
    position_title,
    department_id,
    phone,
    active,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    'president@mseuf.edu.ph',
    'Dr. Maria Enverga',
    'exec',
    FALSE,
    TRUE,
    'president',
    'University President/COO',
    v_president_dept_id,
    '+63 917 999 9999',
    TRUE,
    NOW(),
    NOW()
  FROM auth.users au
  WHERE au.email = 'president@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    is_vp = FALSE,
    is_president = TRUE,
    exec_type = 'president',
    position_title = 'University President/COO',
    department_id = v_president_dept_id,
    updated_at = NOW();

END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════
SELECT 
  email,
  name,
  position_title,
  is_vp,
  is_president,
  exec_type,
  role,
  department_id,
  d.name as department_name,
  d.code as department_code
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.email IN (
  'vp.academics@mseuf.edu.ph',
  'vp.admin@mseuf.edu.ph',
  'vp.external@mseuf.edu.ph',
  'president@mseuf.edu.ph'
)
ORDER BY 
  CASE 
    WHEN is_president = TRUE THEN 1
    WHEN is_vp = TRUE THEN 2
    ELSE 3
  END,
  email;

-- ═══════════════════════════════════════════════════════════════════════
-- EXPECTED OUTPUT:
-- ═══════════════════════════════════════════════════════════════════════
-- president@mseuf.edu.ph          | Dr. Maria Enverga              | University President/COO | FALSE | TRUE  | president | exec | [dept_id] | Office of the President/COO | OPCOO
-- vp.academics@mseuf.edu.ph       | Dr. Roselle Garcia             | VP for Academics...      | TRUE  | FALSE | vp        | exec | [dept_id] | Office of VP for Academics... | OVPAR
-- vp.admin@mseuf.edu.ph           | Mr. Rene Garcia                | VP for Administration    | TRUE  | FALSE | vp        | exec | [dept_id] | Office of VP for Admin... | OVPA
-- vp.external@mseuf.edu.ph        | Mr. Paolo Miranda              | VP for External Relations | TRUE  | FALSE | vp        | exec | [dept_id] | Office of VP for External... | OVPER
-- ═══════════════════════════════════════════════════════════════════════

