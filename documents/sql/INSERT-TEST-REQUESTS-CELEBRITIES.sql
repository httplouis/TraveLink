-- ========================================
-- INSERT TEST REQUESTS - CNAHS with Hollywood Celebrity Names
-- ========================================

-- First, get the CNAHS department ID
-- Replace 'YOUR_CNAHS_DEPT_ID' with actual ID from your database
DO $$
DECLARE
  cnahs_dept_id UUID;
  test_user_id UUID;
BEGIN
  -- Get CNAHS department ID
  SELECT id INTO cnahs_dept_id 
  FROM departments 
  WHERE code = 'CNAHS' OR name LIKE '%Nursing%'
  LIMIT 1;
  
  -- Get a test user ID (or use your actual user ID)
  SELECT id INTO test_user_id 
  FROM users 
  WHERE email LIKE '%nursing%' OR is_head = true
  LIMIT 1;
  
  -- If no user found, just use a random UUID (will fail on FK but shows the idea)
  IF test_user_id IS NULL THEN
    test_user_id := gen_random_uuid();
  END IF;
  
  RAISE NOTICE 'Using CNAHS Department ID: %', cnahs_dept_id;
  RAISE NOTICE 'Using Test User ID: %', test_user_id;
  
  -- INSERT TEST REQUESTS
  
  -- 1. Leonardo DiCaprio - Hospital Visit
  INSERT INTO requests (
    request_type,
    title,
    purpose,
    destination,
    travel_start_date,
    travel_end_date,
    requester_id,
    requester_name,
    requester_is_head,
    department_id,
    submitted_by_user_id,
    submitted_by_name,
    is_representative,
    needs_vehicle,
    vehicle_type,
    status,
    has_budget,
    total_budget
  ) VALUES (
    'travel_order',
    'Campus visit and coordination with partner hospital',
    'Campus visit and coordination with partner hospital',
    'Philippine General Hospital, Manila',
    '2025-11-10',
    '2025-11-12',
    test_user_id,
    'Leonardo DiCaprio',
    false,
    cnahs_dept_id,
    test_user_id,
    'Prof. Juan Dela Cruz',
    true,
    true,
    'University Vehicle',
    'pending_head',
    false,
    0
  );
  
  -- 2. Scarlett Johansson - Nursing Seminar
  INSERT INTO requests (
    request_type,
    title,
    purpose,
    destination,
    travel_start_date,
    travel_end_date,
    requester_id,
    requester_name,
    requester_is_head,
    department_id,
    submitted_by_user_id,
    submitted_by_name,
    is_representative,
    needs_vehicle,
    vehicle_type,
    status,
    has_budget,
    total_budget,
    expense_breakdown
  ) VALUES (
    'seminar',
    'Nursing Leadership and Management Seminar',
    'Nursing Leadership and Management Seminar',
    'SMX Convention Center, Pasay City',
    '2025-11-15',
    '2025-11-17',
    test_user_id,
    'Scarlett Johansson',
    false,
    cnahs_dept_id,
    test_user_id,
    'Prof. Juan Dela Cruz',
    true,
    true,
    'University Vehicle',
    'pending_head',
    true,
    12000,
    '[
      {"item": "Food", "amount": 3000, "description": "Meals"},
      {"item": "Accommodation", "amount": 5000, "description": "Hotel"},
      {"item": "Driver Allowance", "amount": 1500, "description": "Driver costs"},
      {"item": "Other", "amount": 2500, "description": "Registration Fee"}
    ]'::jsonb
  );
  
  -- 3. Tom Holland - Medical Mission
  INSERT INTO requests (
    request_type,
    title,
    purpose,
    destination,
    travel_start_date,
    travel_end_date,
    requester_id,
    requester_name,
    requester_is_head,
    department_id,
    submitted_by_user_id,
    submitted_by_name,
    is_representative,
    needs_vehicle,
    vehicle_type,
    status,
    has_budget,
    total_budget
  ) VALUES (
    'travel_order',
    'Medical mission and community outreach program',
    'Medical mission and community outreach program',
    'Barangay San Isidro, Antipolo City',
    '2025-11-20',
    '2025-11-20',
    test_user_id,
    'Tom Holland',
    false,
    cnahs_dept_id,
    test_user_id,
    'Prof. Maria Santos',
    true,
    true,
    'University Vehicle',
    'pending_head',
    false,
    0
  );
  
  -- 4. Emma Stone - Benchmarking
  INSERT INTO requests (
    request_type,
    title,
    purpose,
    destination,
    travel_start_date,
    travel_end_date,
    requester_id,
    requester_name,
    requester_is_head,
    department_id,
    submitted_by_user_id,
    submitted_by_name,
    is_representative,
    needs_vehicle,
    vehicle_type,
    status,
    has_budget,
    total_budget
  ) VALUES (
    'travel_order',
    'Benchmarking and curriculum development meeting',
    'Benchmarking and curriculum development meeting',
    'University of Santo Tomas, Manila',
    '2025-11-25',
    '2025-11-25',
    test_user_id,
    'Emma Stone',
    false,
    cnahs_dept_id,
    test_user_id,
    'Prof. Ana Reyes',
    true,
    true,
    'University Vehicle',
    'pending_head',
    false,
    0
  );
  
  -- 5. Chris Hemsworth - Clinical Skills Workshop
  INSERT INTO requests (
    request_type,
    title,
    purpose,
    destination,
    travel_start_date,
    travel_end_date,
    requester_id,
    requester_name,
    requester_is_head,
    department_id,
    submitted_by_user_id,
    submitted_by_name,
    is_representative,
    needs_vehicle,
    vehicle_type,
    status,
    has_budget,
    total_budget,
    expense_breakdown
  ) VALUES (
    'seminar',
    'Advanced Clinical Skills Training Workshop',
    'Advanced Clinical Skills Training Workshop',
    'Makati Medical Center, Makati City',
    '2025-12-01',
    '2025-12-03',
    test_user_id,
    'Chris Hemsworth',
    false,
    cnahs_dept_id,
    test_user_id,
    'Prof. Carlos Garcia',
    true,
    true,
    'University Vehicle',
    'pending_head',
    true,
    17500,
    '[
      {"item": "Food", "amount": 4500, "description": "Meals"},
      {"item": "Accommodation", "amount": 8000, "description": "Hotel"},
      {"item": "Driver Allowance", "amount": 2000, "description": "Driver costs"},
      {"item": "Other", "amount": 3000, "description": "Training Materials"}
    ]'::jsonb
  );
  
  RAISE NOTICE '✅ Inserted 5 test requests with Hollywood celebrity names!';
  RAISE NOTICE '📝 Check your requests table for new entries.';
  
END $$;
