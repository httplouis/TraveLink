# Create 3 VPs and 1 President Accounts

## Overview
This guide will help you create accounts for:
1. **VP for Academics and Research** - Dr. Roselle Garcia
2. **VP for Administration** - Mr. Rene Garcia
3. **VP for External Relations** - Mr. Paolo Miranda
4. **President/COO** - Dr. Maria Enverga

## Method 1: Via Supabase Dashboard (Recommended)

### Step 1: Create Auth Users
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create New User**
4. Create each account with these details:

#### VP 1: Academics and Research
- **Email**: `vp.academics@mseuf.edu.ph`
- **Password**: `VP.Academics@2025` (or your preferred password)
- **Auto Confirm User**: ✅ (checked)

#### VP 2: Administration
- **Email**: `vp.admin@mseuf.edu.ph`
- **Password**: `VP.Admin@2025` (or your preferred password)
- **Auto Confirm User**: ✅ (checked)

#### VP 3: External Relations
- **Email**: `vp.external@mseuf.edu.ph`
- **Password**: `VP.External@2025` (or your preferred password)
- **Auto Confirm User**: ✅ (checked)

#### President
- **Email**: `president@mseuf.edu.ph`
- **Password**: `President@2025` (or your preferred password)
- **Auto Confirm User**: ✅ (checked)

### Step 2: Run SQL Script
After creating the auth users, run the SQL script:
```sql
-- Run: CREATE-3-VPS-AND-PRESIDENT-ACCOUNTS.sql
```

This will:
- Link the auth users to the `users` table
- Set proper roles (`is_vp`, `is_president`, `exec_type`)
- Assign department IDs
- Set position titles

## Method 2: Via API (Programmatic)

If you want to create accounts programmatically, you can use the Supabase Admin API:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key
);

// Create VP 1
const { data: vp1, error: err1 } = await supabaseAdmin.auth.admin.createUser({
  email: 'vp.academics@mseuf.edu.ph',
  password: 'VP.Academics@2025',
  email_confirm: true,
  user_metadata: {
    name: 'Dr. Roselle Garcia',
    role: 'exec',
    is_vp: true,
    exec_type: 'vp'
  }
});

// Create VP 2
const { data: vp2, error: err2 } = await supabaseAdmin.auth.admin.createUser({
  email: 'vp.admin@mseuf.edu.ph',
  password: 'VP.Admin@2025',
  email_confirm: true,
  user_metadata: {
    name: 'Mr. Rene Garcia',
    role: 'exec',
    is_vp: true,
    exec_type: 'vp'
  }
});

// Create VP 3
const { data: vp3, error: err3 } = await supabaseAdmin.auth.admin.createUser({
  email: 'vp.external@mseuf.edu.ph',
  password: 'VP.External@2025',
  email_confirm: true,
  user_metadata: {
    name: 'Mr. Paolo Miranda',
    role: 'exec',
    is_vp: true,
    exec_type: 'vp'
  }
});

// Create President
const { data: president, error: err4 } = await supabaseAdmin.auth.admin.createUser({
  email: 'president@mseuf.edu.ph',
  password: 'President@2025',
  email_confirm: true,
  user_metadata: {
    name: 'Dr. Maria Enverga',
    role: 'exec',
    is_president: true,
    exec_type: 'president'
  }
});
```

Then run the SQL script to complete the setup.

## Verification

After creating accounts, verify with:

```sql
SELECT 
  email,
  name,
  position_title,
  is_vp,
  is_president,
  exec_type,
  role
FROM users 
WHERE email IN (
  'vp.academics@mseuf.edu.ph',
  'vp.admin@mseuf.edu.ph',
  'vp.external@mseuf.edu.ph',
  'president@mseuf.edu.ph'
);
```

## Login Credentials Summary

| Role | Email | Password | Portal |
|------|-------|----------|--------|
| VP Academics | `vp.academics@mseuf.edu.ph` | `VP.Academics@2025` | `/vp/*` |
| VP Admin | `vp.admin@mseuf.edu.ph` | `VP.Admin@2025` | `/vp/*` |
| VP External | `vp.external@mseuf.edu.ph` | `VP.External@2025` | `/vp/*` |
| President | `president@mseuf.edu.ph` | `President@2025` | `/president/*` |

## Notes

- All VPs share the same portal (`/vp/*`) but can see requests for their specific departments
- The President has final approval authority
- Passwords should be changed after first login
- Make sure to run the SQL script AFTER creating auth users

