# User Request Submission Error Fix

## Problem
User getting error: **"Submit failed - Invalid department of user information. Please refresh the page and try again."**

## Root Cause
The user's account in the database does not have a valid `department_id` assigned. When submitting a request, the system requires:
1. User must have a `department_id`
2. That `department_id` must exist in the `departments` table

## Error Details
- **Error Code**: `23503` (Foreign Key Violation)
- **Location**: `/api/requests/submit` route
- **Cause**: User profile has `NULL` or invalid `department_id`

## Solution

### Step 1: Identify the User
Run `CHECK-USER-DEPARTMENT.sql` to see which users have missing departments:

```sql
SELECT 
  u.email,
  u.name,
  u.department_id,
  d.name as department_name
FROM users u
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.role IN ('faculty', 'head');
```

### Step 2: Fix the User's Department
Run `FIX-USER-DEPARTMENT.sql` and:

1. **Find available departments**:
   ```sql
   SELECT id, code, name FROM departments ORDER BY name;
   ```

2. **Update the user** (change the email and department name):
   ```sql
   UPDATE users 
   SET department_id = (
     SELECT id FROM departments 
     WHERE name LIKE '%College of Nursing%'  -- Change this
     LIMIT 1
   )
   WHERE email = 'juandelacruz@mseuf.edu.ph';  -- Change this
   ```

3. **Verify the fix**:
   ```sql
   SELECT u.email, u.name, d.name as department
   FROM users u
   LEFT JOIN departments d ON d.id = u.department_id
   WHERE u.email = 'juandelacruz@mseuf.edu.ph';
   ```

### Step 3: Test
After updating the database:
1. User should **refresh the page**
2. Try submitting the request again
3. Should work now! ✅

## Improvements Made
1. ✅ Better error messages - now tells user to contact admin
2. ✅ Early validation - checks department before attempting insert
3. ✅ Detailed logging - helps debug foreign key issues
4. ✅ Specific error messages for different constraint violations

## Prevention
To prevent this in the future:
- Always assign a department when creating faculty/head users
- Add a NOT NULL constraint on `users.department_id` (optional)
- Add validation in the user registration/admin form

## Files Created
1. `CHECK-USER-DEPARTMENT.sql` - Diagnose the issue
2. `FIX-USER-DEPARTMENT.sql` - Fix user department assignments
3. This guide - `USER-SUBMIT-FIX.md`

## Quick Fix Command
```sql
-- Change the email and department name:
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'College of Nursing and Allied Health Sciences' LIMIT 1)
WHERE email = 'juandelacruz@mseuf.edu.ph';
```
