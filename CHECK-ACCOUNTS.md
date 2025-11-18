# Check Accounts in Database

## How to Check if Accounts Exist

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Open the `users` table
4. Check if there are any rows

### Option 2: Via API
You can check accounts by calling:
```
GET /api/user
```
This will return the current logged-in user's profile.

### Option 3: Via SQL Query
Run this in Supabase SQL Editor:
```sql
SELECT 
  id,
  email,
  name,
  role,
  is_admin,
  is_head,
  is_hr,
  is_vp,
  is_president,
  is_comptroller,
  department_id,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 50;
```

## Test Accounts That Should Exist

Based on the codebase, these accounts should exist:
- `admin@mseuf.edu.ph` - Admin
- `admin.cleofe@mseuf.edu.ph` - Admin
- `comptroller@mseuf.edu.ph` - Comptroller
- `vp@mseuf.edu.ph` - Vice President
- `president@mseuf.edu.ph` - President/COO

## Create Test Accounts

If accounts don't exist, you can create them via:
1. Registration page (`/register`)
2. Admin user management (`/admin/users`)
3. Direct SQL insert (for testing)

