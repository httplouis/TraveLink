-- Check if request has department_id
SELECT 
  id,
  request_number,
  requester_id,
  department_id,
  requester_name,
  status
FROM requests
WHERE request_number = 'TO-2025-074';

-- Check requester's department
SELECT 
  u.id,
  u.name,
  u.email,
  u.department_id,
  u.department as department_text,
  d.id as dept_id,
  d.name as dept_name,
  d.code as dept_code
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.id = (SELECT requester_id FROM requests WHERE request_number = 'TO-2025-074');

-- Check if departments table has data
SELECT * FROM departments LIMIT 5;
