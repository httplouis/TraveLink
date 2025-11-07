-- Check Trizzia's role
SELECT 
  email,
  name,
  role,
  department,
  is_head,
  is_hr,
  is_exec
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- If role is NOT 'admin', update it:
UPDATE public.users
SET role = 'admin'
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Verify
SELECT email, role FROM public.users WHERE email = 'casinotrizzia@mseuf.edu.ph';
