# Verify Department Resolution

Test department resolution logic for a specific user.

## Quick Check

```sql
-- Get user's current department info
SELECT 
  u.id,
  u.email,
  u.name,
  u.department_id,
  u.department as department_text,
  d.name as resolved_department_name,
  d.code as resolved_department_code
FROM public.users u
LEFT JOIN public.departments d ON u.department_id = d.id
WHERE u.id = 'user-id-here';
```

## Resolution Test

1. **Check if department_id exists**
   - If yes: ✅ Resolved
   - If no: Continue to step 2

2. **Check if department text exists**
   - If no: ❌ User needs department assignment
   - If yes: Continue to step 3

3. **Try to match department text**
   ```sql
   -- Find matching departments
   SELECT 
     id,
     name,
     code,
     CASE 
       WHEN LOWER(name) = LOWER('user-department-text') THEN 'Exact Match'
       WHEN LOWER(code) = LOWER('user-department-text') THEN 'Code Match'
       WHEN LOWER(name) LIKE '%' || LOWER('user-department-text') || '%' THEN 'Partial Match'
       ELSE 'No Match'
     END as match_type
   FROM public.departments
   WHERE LOWER(name) = LOWER('user-department-text')
      OR LOWER(code) = LOWER('user-department-text')
      OR LOWER(name) LIKE '%' || LOWER('user-department-text') || '%';
   ```

4. **If match found**: Update user's department_id
5. **If no match**: User needs manual department assignment

## Common Department Names

- "CCMS" → "College of Computing and Multimedia Studies"
- "CNAHS" → "College of Nursing and Allied Health Sciences"
- "CBA" → "College of Business and Accountancy"
- "CENG" → "College of Engineering"

## Key Points
- Always check department_id first
- Use case-insensitive matching
- Try exact, code, then partial match
- Update department_id after resolution
- Log all resolution attempts

