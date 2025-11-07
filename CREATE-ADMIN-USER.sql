-- Option 2: Create an admin user record in the users table
-- This ensures the foreign key constraint is satisfied

-- First, get your current auth user ID
-- Run this to see your user ID:
SELECT 
    auth.users.id,
    auth.users.email
FROM auth.users
WHERE auth.users.email = 'admin@travilink.com'  -- Change to your admin email
LIMIT 1;

-- Then insert into users table (REPLACE the UUID with your actual ID from above)
-- Example:
-- INSERT INTO public.users (
--   id,
--   email,
--   name,
--   role,
--   department_id
-- ) VALUES (
--   '<YOUR_AUTH_USER_ID_HERE>',  -- Replace with actual UUID from query above
--   'admin@travilink.com',        -- Your email
--   'Admin User',                 -- Your name
--   'admin',                      -- Role
--   NULL                          -- Department (optional for admin)
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Verify user exists
SELECT id, email, name, role 
FROM public.users 
WHERE email LIKE '%admin%';
