-- ═══════════════════════════════════════════════════════════════════════
-- CREATE ALL EXECUTIVE, COMPTROLLER, ADMIN, AND HR ACCOUNTS
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- This script creates accounts for:
-- 1. President/COO
-- 2. SVP for Academics and Research
-- 3. VP for Administration
-- 4. VP for External Relations
-- 5. VP for Finance and University Treasurer
-- 6. Comptroller
-- 7. Financial Analyst (under Comptroller)
-- 8. Director, Treasury Services (Admin)
-- 9. Treasury Staff / School Transportation Coordinator (Admin)
--
-- NOTE: You need to create these accounts in Supabase Auth first,
-- then run this script to update the users table with proper roles.
--
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- Department IDs
  v_president_dept_id UUID := '398e97fd-191f-4f1a-95ad-2e32c429c0ef'; -- Office of the President/COO
  v_svp_academics_dept_id UUID := '2ccc7696-ebd7-4866-9edc-9cdf280149ff'; -- Office of the Vice President for Academics and Research
  v_vp_admin_dept_id UUID := '5d0e7a08-9198-4209-85d6-8d73e2b80d7e'; -- Office of the Vice President for Administration
  v_vp_external_dept_id UUID := '1c69bf47-1c43-4652-baba-b8a5388f667d'; -- Office of the Vice President for External Relations
  v_vp_finance_dept_id UUID := 'ac5d892d-e73f-4ae6-ac14-6e17bc525974'; -- Office of the Vice President for Finance
  v_comptroller_dept_id UUID := '24033a9b-cd26-465a-ac90-406d4b0b4358'; -- Office of the Comptroller
  v_treasury_dept_id UUID; -- Treasury Department (will be fetched)
  v_hr_dept_id UUID; -- Human Resource Department (will be fetched)
BEGIN
  -- Add is_comptroller column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'is_comptroller'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN is_comptroller BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE '✅ Added is_comptroller column to users table';
  END IF;

  -- Get Treasury Department ID (use Treasury Department, not Treasury Office)
  SELECT id INTO v_treasury_dept_id 
  FROM departments 
  WHERE name = 'Treasury Department' OR code = 'TD'
  LIMIT 1;
  
  -- Fallback to Treasury Office if Treasury Department not found
  IF v_treasury_dept_id IS NULL THEN
    SELECT id INTO v_treasury_dept_id 
    FROM departments 
    WHERE name = 'Treasury Office' OR code = 'TREAS'
    LIMIT 1;
  END IF;
  
  -- Get HR Department ID
  SELECT id INTO v_hr_dept_id 
  FROM departments 
  WHERE name ILIKE '%human resource%' OR code IN ('HR', 'HRD')
  LIMIT 1;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 1. PRESIDENT: Naila E. Leveriza, COO
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
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'president@mseuf.edu.ph',
    'Naila E. Leveriza',
    'exec',
    FALSE,
    TRUE,
    'president',
    'University President/COO',
    v_president_dept_id,
    '+63 917 999 9999',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'president@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Naila E. Leveriza',
    is_vp = FALSE,
    is_president = TRUE,
    exec_type = 'president',
    position_title = 'University President/COO',
    department_id = v_president_dept_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 2. SVP FOR ACADEMICS AND RESEARCH: Dr. Benilda Villenas
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
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'svp.academics@mseuf.edu.ph',
    'Dr. Benilda Villenas',
    'exec',
    TRUE,
    FALSE,
    'svp_academics',
    'Senior Vice President for Academics and Research',
    v_svp_academics_dept_id,
    '+63 917 111 1111',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'svp.academics@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Dr. Benilda Villenas',
    is_vp = TRUE,
    is_president = FALSE,
    exec_type = 'svp_academics',
    position_title = 'Senior Vice President for Academics and Research',
    department_id = v_svp_academics_dept_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 3. VP FOR ADMINISTRATION: Atty. Dario R. Opistan
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
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'vp.admin@mseuf.edu.ph',
    'Atty. Dario R. Opistan',
    'exec',
    TRUE,
    FALSE,
    'vp_admin',
    'Vice President for Administration',
    v_vp_admin_dept_id,
    '+63 917 222 2222',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'vp.admin@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Atty. Dario R. Opistan',
    is_vp = TRUE,
    is_president = FALSE,
    exec_type = 'vp_admin',
    position_title = 'Vice President for Administration',
    department_id = v_vp_admin_dept_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 4. VP FOR EXTERNAL RELATIONS: Celso D. Jaballa
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
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'vp.external@mseuf.edu.ph',
    'Celso D. Jaballa',
    'exec',
    TRUE,
    FALSE,
    'vp_external',
    'Vice President for External Relations',
    v_vp_external_dept_id,
    '+63 917 333 3333',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'vp.external@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Celso D. Jaballa',
    is_vp = TRUE,
    is_president = FALSE,
    exec_type = 'vp_external',
    position_title = 'Vice President for External Relations',
    department_id = v_vp_external_dept_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 5. VP FOR FINANCE AND UNIVERSITY TREASURER: Carlito M. Rodriguez
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
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'vp.finance@mseuf.edu.ph',
    'Carlito M. Rodriguez',
    'exec',
    TRUE,
    FALSE,
    'vp_finance',
    'Vice President for Finance and University Treasurer',
    v_vp_finance_dept_id,
    '+63 917 444 4444',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'vp.finance@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Carlito M. Rodriguez',
    is_vp = TRUE,
    is_president = FALSE,
    exec_type = 'vp_finance',
    position_title = 'Vice President for Finance and University Treasurer',
    department_id = v_vp_finance_dept_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 6. COMPTROLLER: Carlos Jayron A. Remiendo
  -- Parent: VP for Finance (Carlito M. Rodriguez)
  -- ═══════════════════════════════════════════════════════════════════════
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_comptroller,
    position_title,
    department_id,
    phone,
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'comptroller@mseuf.edu.ph',
    'Carlos Jayron A. Remiendo',
    'comptroller',
    TRUE,
    'Comptroller',
    v_comptroller_dept_id,
    '+63 917 555 5555',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'comptroller@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Carlos Jayron A. Remiendo',
    role = 'comptroller',
    is_comptroller = TRUE,
    position_title = 'Comptroller',
    department_id = v_comptroller_dept_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 7. FINANCIAL ANALYST: Audrey R. Abulencia
  -- Parent: Comptroller (Carlos Jayron A. Remiendo)
  -- ═══════════════════════════════════════════════════════════════════════
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
    'audrey.abulencia@mseuf.edu.ph',
    'Audrey R. Abulencia',
    'comptroller',
    'Financial Analyst',
    v_comptroller_dept_id,
    '+63 917 666 6666',
    TRUE,
    TRUE, -- is_comptroller = TRUE (can receive requests)
    NOW()
  FROM auth.users au
  WHERE au.email = 'audrey.abulencia@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Audrey R. Abulencia',
    role = 'comptroller',
    position_title = 'Financial Analyst',
    department_id = v_comptroller_dept_id,
    is_comptroller = TRUE;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 7B. FINANCIAL ANALYST: Albert D. Alingalan
  -- Parent: Comptroller (Carlos Jayron A. Remiendo)
  -- Kapantay ni Audrey (same level)
  -- ═══════════════════════════════════════════════════════════════════════
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

  -- ═══════════════════════════════════════════════════════════════════════
  -- 8. DIRECTOR, TREASURY SERVICES: Cleofe A. Atayde
  -- Parent: VP for Finance (Carlito M. Rodriguez)
  -- Role: Head + Admin (can use admin view)
  -- ═══════════════════════════════════════════════════════════════════════
  -- Disable triggers temporarily to handle circular dependency
  ALTER TABLE public.users DISABLE TRIGGER trg_users_role_change_guard;
  ALTER TABLE public.admins DISABLE TRIGGER trg_admins_role_guard;

  -- Step 1: Insert/update user first
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_head,
    is_admin,
    position_title,
    department_id,
    phone,
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'cleofe.atayde@mseuf.edu.ph',
    'Cleofe A. Atayde',
    'admin',
    TRUE,
    TRUE,
    'Director, Treasury Services',
    COALESCE(v_treasury_dept_id, v_vp_finance_dept_id),
    '+63 917 777 7777',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'cleofe.atayde@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Cleofe A. Atayde',
    is_head = TRUE,
    is_admin = TRUE,
    role = 'admin',
    position_title = 'Director, Treasury Services',
    department_id = COALESCE(v_treasury_dept_id, v_vp_finance_dept_id);

  -- Step 2: Insert into admins table
  INSERT INTO public.admins (user_id, super_admin)
  SELECT id, FALSE
  FROM public.users
  WHERE email = 'cleofe.atayde@mseuf.edu.ph'
  ON CONFLICT (user_id) DO UPDATE SET super_admin = FALSE;

  -- Re-enable triggers
  ALTER TABLE public.users ENABLE TRIGGER trg_users_role_change_guard;
  ALTER TABLE public.admins ENABLE TRIGGER trg_admins_role_guard;

  -- ═══════════════════════════════════════════════════════════════════════
  -- 9. TREASURY STAFF / SCHOOL TRANSPORTATION COORDINATOR: Trizzia Maree Z. Casiño
  -- Parent: Cleofe A. Atayde (Director, Treasury Services)
  -- Role: Admin (can use admin view)
  -- ═══════════════════════════════════════════════════════════════════════
  -- Disable triggers temporarily to handle circular dependency
  ALTER TABLE public.users DISABLE TRIGGER trg_users_role_change_guard;
  ALTER TABLE public.admins DISABLE TRIGGER trg_admins_role_guard;

  -- Step 1: Insert/update user first
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_admin,
    position_title,
    department_id,
    phone,
    is_active,
    created_at
  )
  SELECT 
    au.id,
    'trizzia.casino@mseuf.edu.ph',
    'Trizzia Maree Z. Casiño',
    'admin',
    TRUE,
    'Treasury Staff / School Transportation Coordinator',
    COALESCE(v_treasury_dept_id, v_vp_finance_dept_id),
    '+63 917 888 8888',
    TRUE,
    NOW()
  FROM auth.users au
  WHERE au.email = 'trizzia.casino@mseuf.edu.ph'
  ON CONFLICT (email) DO UPDATE SET
    name = 'Trizzia Maree Z. Casiño',
    is_admin = TRUE,
    role = 'admin',
    position_title = 'Treasury Staff / School Transportation Coordinator',
    department_id = COALESCE(v_treasury_dept_id, v_vp_finance_dept_id);

  -- Step 2: Insert into admins table
  INSERT INTO public.admins (user_id, super_admin)
  SELECT id, FALSE
  FROM public.users
  WHERE email = 'trizzia.casino@mseuf.edu.ph'
  ON CONFLICT (user_id) DO UPDATE SET super_admin = FALSE;

  -- Re-enable triggers
  ALTER TABLE public.users ENABLE TRIGGER trg_users_role_change_guard;
  ALTER TABLE public.admins ENABLE TRIGGER trg_admins_role_guard;

  RAISE NOTICE '✅ All accounts created/updated successfully!';
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- ADD PARENT_ID COLUMN IF NOT EXISTS (for hierarchy)
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Added parent_id column to users table';
  ELSE
    RAISE NOTICE '✅ parent_id column already exists';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- SET PARENT RELATIONSHIPS (Hierarchical Structure)
-- ═══════════════════════════════════════════════════════════════════════

-- Set Comptroller's parent to VP Finance
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'vp.finance@mseuf.edu.ph')
WHERE email = 'comptroller@mseuf.edu.ph';

-- Set Financial Analysts' parent to Comptroller
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'comptroller@mseuf.edu.ph')
WHERE email IN ('audrey.abulencia@mseuf.edu.ph', 'albert.alingalan@mseuf.edu.ph');

-- Set Director Treasury Services' parent to VP Finance
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'vp.finance@mseuf.edu.ph')
WHERE email = 'cleofe.atayde@mseuf.edu.ph';

-- Set Treasury Staff's parent to Director Treasury Services
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'cleofe.atayde@mseuf.edu.ph')
WHERE email = 'trizzia.casino@mseuf.edu.ph';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════
SELECT 
  u.email,
  u.name,
  u.position_title,
  u.role,
  u.is_president,
  u.is_vp,
  u.is_comptroller,
  u.is_head,
  u.is_admin,
  u.exec_type,
  d.name as department_name,
  d.code as department_code,
  parent.name as parent_name,
  parent.email as parent_email
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN users parent ON u.parent_id = parent.id
WHERE u.email IN (
  'president@mseuf.edu.ph',
  'svp.academics@mseuf.edu.ph',
  'vp.admin@mseuf.edu.ph',
  'vp.external@mseuf.edu.ph',
  'vp.finance@mseuf.edu.ph',
  'comptroller@mseuf.edu.ph',
  'audrey.abulencia@mseuf.edu.ph',
  'cleofe.atayde@mseuf.edu.ph',
  'trizzia.casino@mseuf.edu.ph'
)
ORDER BY 
  CASE 
    WHEN u.is_president = TRUE THEN 1
    WHEN u.is_vp = TRUE THEN 2
    WHEN u.is_comptroller = TRUE THEN 3
    WHEN u.is_head = TRUE THEN 4
    WHEN u.is_admin = TRUE THEN 5
    ELSE 6
  END,
  u.email;

