# 🔐 Test Credentials - TraviLink System

## All Test Accounts

### 1. Regular Faculty/Staff (USER)
```
Email: faculty@mseuf.edu.ph
Password: Test@123
Role: faculty
Access: /user dashboard
```

### 2. Department Head (HEAD)
```
Email: head.nursing@mseuf.edu.ph
Password: Test@123
Role: head (auto-granted from roster)
Department: CNAHS
Access: /head/dashboard
```

### 3. HR (Human Resources)
```
Email: hr.admin@mseuf.edu.ph
Password: Test@123
Role: hr
Access: /hr/dashboard
```

### 4. Comptroller
```
Email: comptroller@mseuf.edu.ph
Password: Test@123
Role: comptroller
Access: /comptroller/dashboard
```

### 5. Executive (EXEC)
```
Email: exec.president@mseuf.edu.ph
Password: Test@123
Role: exec
Access: /exec/dashboard
```

### 6. Admin (ADMIN)
```
Email: admin@mseuf.edu.ph
Password: Admin@123
Role: admin
Access: /admin (full system access)
```

### 7. Driver
```
Phone: +639171234567
Password: Driver@123
Role: driver
Access: /driver
```

---

## Quick Copy-Paste Credentials:

### Faculty:
```
faculty@mseuf.edu.ph
Test@123
```

### Department Head:
```
head.nursing@mseuf.edu.ph
Test@123
```

### HR:
```
hr.admin@mseuf.edu.ph
Test@123
```

### Comptroller:
```
comptroller@mseuf.edu.ph
Test@123
```

### Executive:
```
exec.president@mseuf.edu.ph
Test@123
```

### Admin:
```
admin@mseuf.edu.ph
Admin@123
```

---

## SQL Script to Create Test Users:

```sql
-- Insert test users into Supabase Auth (run in Supabase dashboard)

-- 1. Faculty
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'faculty@mseuf.edu.ph',
  crypt('Test@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Department Head
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'head.nursing@mseuf.edu.ph',
  crypt('Test@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. HR
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'hr.admin@mseuf.edu.ph',
  crypt('Test@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 4. Comptroller
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'comptroller@mseuf.edu.ph',
  crypt('Test@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 5. Executive
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'exec.president@mseuf.edu.ph',
  crypt('Test@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 6. Admin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mseuf.edu.ph',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

---

## OR Use Supabase Dashboard (Easier):

### Method 1: Authentication > Users > Add User
```
1. Go to Supabase Dashboard
2. Authentication → Users
3. Click "Add User"
4. Email: faculty@mseuf.edu.ph
5. Password: Test@123
6. Auto Confirm: YES
7. Click "Create User"
```

Repeat for all accounts above.

---

## App Database (users table):

After creating auth users, insert into app `users` table:

```sql
-- Link Supabase Auth users to app users table

-- 1. Faculty
INSERT INTO public.users (auth_user_id, email, full_name, role, department)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'faculty@mseuf.edu.ph'),
  'faculty@mseuf.edu.ph',
  'John Doe',
  'faculty',
  'CCMS'
);

-- 2. Department Head
INSERT INTO public.users (auth_user_id, email, full_name, role, department)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'head.nursing@mseuf.edu.ph'),
  'head.nursing@mseuf.edu.ph',
  'Dr. Maria Santos',
  'head',
  'CNAHS'
);

-- 3. HR
INSERT INTO public.users (auth_user_id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'hr.admin@mseuf.edu.ph'),
  'hr.admin@mseuf.edu.ph',
  'HR Admin',
  'hr'
);

-- 4. Comptroller
INSERT INTO public.users (auth_user_id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'comptroller@mseuf.edu.ph'),
  'comptroller@mseuf.edu.ph',
  'Finance Officer',
  'comptroller'
);

-- 5. Executive
INSERT INTO public.users (auth_user_id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'exec.president@mseuf.edu.ph'),
  'exec.president@mseuf.edu.ph',
  'University President',
  'exec'
);

-- 6. Admin
INSERT INTO public.users (auth_user_id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@mseuf.edu.ph'),
  'admin@mseuf.edu.ph',
  'System Administrator',
  'admin'
);
```

---

## Roster for Auto-Grant (Department Head):

```sql
-- Add to roster_heads for auto-grant on login
INSERT INTO public.roster_heads (department_id, head_email, is_active)
VALUES (
  (SELECT id FROM public.departments WHERE code = 'CNAHS'),
  'head.nursing@mseuf.edu.ph',
  TRUE
);
```

---

## Remember Me Feature:

### How It Works:
1. Check "Remember me" on login
2. Your email is saved to browser localStorage
3. Next time you visit login page → email auto-filled
4. Just enter password and login ✅

### To Clear:
- Uncheck "Remember me" before logging in
- OR clear browser localStorage:
  ```javascript
  localStorage.removeItem("rememberedEmail");
  ```

---

## Testing Workflow:

### Test 1: Faculty Login
```
1. Go to /login
2. Enter: faculty@mseuf.edu.ph / Test@123
3. Check "Remember me"
4. Login
5. Should redirect to: /user
```

### Test 2: Department Head Auto-Grant
```
1. Go to /login
2. Enter: head.nursing@mseuf.edu.ph / Test@123
3. Login (first time)
4. System checks roster_heads
5. Auto-grants head role + department_heads mapping
6. Redirects to: /head/dashboard ✅
```

### Test 3: Remember Me
```
1. Login with "Remember me" checked
2. Logout
3. Go back to /login
4. Email should be pre-filled ✅
5. Just enter password
```

---

## Quick Setup Commands:

```bash
# 1. Run RBAC SQL
\i database-comprehensive-rbac.sql

# 2. Create test users in Supabase Dashboard
# (Use Authentication > Users > Add User)

# 3. Link users to app database
# (Run SQL inserts above)

# 4. Test login
# http://localhost:3000/login
```

---

**All credentials use standard test passwords for development only! Change in production! 🔒**
