-- ============================================
-- FIX USERS TABLE: Add department_id FK
-- ============================================

-- Step 1: Add department_id column to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department_id);

-- Step 3: Map old TEXT department to new UUID department_id
-- CNAHS Faculty
UPDATE public.users
SET department_id = (SELECT id FROM public.departments WHERE code = 'CNAHS' LIMIT 1)
WHERE email LIKE '%cnahs%' OR department = 'CNAHS';

-- CNAHS Head (Dr. Melissa Ramos from form, but head.nursing user)
UPDATE public.users
SET department_id = (SELECT id FROM public.departments WHERE code = 'CNAHS' LIMIT 1),
    is_head = true,
    name = 'Dr. Melissa Ramos'
WHERE email = 'head.nursing@mseuf.edu.ph';

-- CCMS Faculty (existing test user)
UPDATE public.users
SET department_id = (SELECT id FROM public.departments WHERE code = 'CCMS' LIMIT 1)
WHERE email = 'faculty@mseuf.edu.ph' OR department = 'CCMS';

-- ============================================
-- CREATE PROPER TEST USERS
-- ============================================

-- CNAHS Faculty (new user for testing)
DO $$
DECLARE
  v_auth_id UUID;
  v_dept_id UUID;
BEGIN
  -- Get CNAHS department ID
  SELECT id INTO v_dept_id FROM public.departments WHERE code = 'CNAHS' LIMIT 1;
  
  -- Check if auth user exists
  SELECT id INTO v_auth_id FROM auth.users WHERE email = 'faculty.cnahs@mseuf.edu.ph';
  
  IF v_auth_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      id, 
      email, 
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      'faculty.cnahs@mseuf.edu.ph',
      crypt('Faculty@123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_auth_id;
  END IF;
  
  -- Insert/update public.users
  INSERT INTO public.users (auth_user_id, name, email, role, department, department_id, is_head, is_hr, is_exec)
  VALUES (v_auth_id, 'Prof. Juan Dela Cruz', 'faculty.cnahs@mseuf.edu.ph', 'faculty', 'CNAHS', v_dept_id, false, false, false)
  ON CONFLICT (auth_user_id) DO UPDATE SET 
    name = 'Prof. Juan Dela Cruz', 
    department = 'CNAHS',
    department_id = v_dept_id,
    is_head = false;
END $$;

-- CNAHS Head (Dr. Melissa Ramos)
DO $$
DECLARE
  v_auth_id UUID;
  v_dept_id UUID;
BEGIN
  -- Get CNAHS department ID
  SELECT id INTO v_dept_id FROM public.departments WHERE code = 'CNAHS' LIMIT 1;
  
  -- Check if auth user exists
  SELECT id INTO v_auth_id FROM auth.users WHERE email = 'head.nursing@mseuf.edu.ph';
  
  IF v_auth_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      id, 
      email, 
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      'head.nursing@mseuf.edu.ph',
      crypt('Head@123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_auth_id;
  END IF;
  
  -- Insert/update public.users
  INSERT INTO public.users (auth_user_id, name, email, role, department, department_id, is_head, is_hr, is_exec)
  VALUES (v_auth_id, 'Dr. Melissa Ramos', 'head.nursing@mseuf.edu.ph', 'faculty', 'CNAHS', v_dept_id, true, false, false)
  ON CONFLICT (auth_user_id) DO UPDATE SET 
    name = 'Dr. Melissa Ramos', 
    department = 'CNAHS',
    department_id = v_dept_id,
    is_head = true;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  u.name,
  u.email,
  u.is_head,
  d.name as department_name,
  d.code as department_code
FROM public.users u
LEFT JOIN public.departments d ON u.department_id = d.id
WHERE u.email IN (
  'faculty@mseuf.edu.ph',
  'faculty.cnahs@mseuf.edu.ph',
  'head.nursing@mseuf.edu.ph'
)
ORDER BY u.email;

-- Show all department assignments
SELECT 
  COUNT(*) as total_users_with_department,
  d.name as department_name
FROM public.users u
JOIN public.departments d ON u.department_id = d.id
GROUP BY d.name
ORDER BY total_users_with_department DESC;

-- ============================================
-- DONE!
-- ============================================
