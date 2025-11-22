-- Fix requests that don't have department_id but requester has one
-- This will copy the department_id from the requester's user record to the request

-- First, check how many requests are missing department_id
SELECT 
  COUNT(*) as requests_without_dept,
  COUNT(DISTINCT requester_id) as unique_requesters
FROM requests 
WHERE department_id IS NULL;

-- See specific requests missing department
SELECT 
  r.id,
  r.request_number,
  r.requester_name,
  r.department_id as request_dept_id,
  u.name as requester_name_from_users,
  u.department_id as user_dept_id,
  d.name as dept_name
FROM requests r
JOIN users u ON r.requester_id = u.id
LEFT JOIN departments d ON u.department_id = d.id
WHERE r.department_id IS NULL
LIMIT 10;

-- UPDATE: Copy department_id from requester to request
UPDATE requests r
SET department_id = u.department_id
FROM users u
WHERE r.requester_id = u.id
  AND r.department_id IS NULL
  AND u.department_id IS NOT NULL;

-- Verify the fix
SELECT 
  r.request_number,
  r.requester_name,
  r.department_id,
  d.name as dept_name,
  d.code as dept_code
FROM requests r
LEFT JOIN departments d ON r.department_id = d.id
WHERE r.request_number = 'TO-2025-074';
