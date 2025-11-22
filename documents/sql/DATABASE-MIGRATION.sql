-- ============================================
-- Migration Script: travel_requests → requests
-- Migrate old table to new workflow system
-- ============================================

-- Step 1: Backup old table (optional but recommended)
CREATE TABLE IF NOT EXISTS public.travel_requests_backup AS 
SELECT * FROM public.travel_requests;

-- Step 2: Map old statuses to new statuses
CREATE OR REPLACE FUNCTION map_old_status_to_new(old_status TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE old_status
    WHEN 'pending' THEN RETURN 'pending_head';
    WHEN 'pending_head' THEN RETURN 'pending_head';
    WHEN 'admin_received' THEN RETURN 'pending_admin';
    WHEN 'head_approved' THEN RETURN 'pending_admin';
    WHEN 'approved' THEN RETURN 'approved';
    WHEN 'rejected' THEN RETURN 'rejected';
    WHEN 'head_rejected' THEN RETURN 'rejected';
    WHEN 'cancelled' THEN RETURN 'cancelled';
    WHEN 'completed' THEN RETURN 'approved';
    ELSE RETURN 'pending_head';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create and populate all departments/offices
-- Run the complete departments insert script
\i INSERT-ALL-DEPARTMENTS.sql

-- Step 4: Migrate data from travel_requests to requests
INSERT INTO public.requests (
  id,
  request_type,
  request_number,
  title,
  purpose,
  destination,
  
  travel_start_date,
  travel_end_date,
  created_at,
  updated_at,
  
  requester_id,
  requester_is_head,
  department_id,
  
  participants,
  head_included,
  
  has_budget,
  total_budget,
  expense_breakdown,
  
  needs_vehicle,
  vehicle_type,
  assigned_vehicle_id,
  assigned_driver_id,
  
  status,
  current_approver_role,
  
  head_approved_at,
  admin_processed_at,
  
  rejected_at,
  rejected_by
)
SELECT 
  tr.id,
  'travel_order'::request_type, -- Default to travel_order
  tr.request_number,
  COALESCE((tr.payload->'travelOrder'->>'purpose')::TEXT, 
           (tr.payload->'travelOrder'->>'purposeOfTravel')::TEXT, 
           'Travel Request'),
  COALESCE((tr.payload->'travelOrder'->>'purpose')::TEXT,
           (tr.payload->'travelOrder'->>'purposeOfTravel')::TEXT,
           ''),
  COALESCE((tr.payload->'travelOrder'->>'destination')::TEXT,
           (tr.payload->'travelOrder'->>'placeToBeVisited')::TEXT,
           ''),
  
  COALESCE(tr.travel_date, tr.created_at),
  COALESCE(tr.travel_date, tr.created_at),
  tr.created_at,
  tr.updated_at,
  
  tr.user_id,
  false, -- Assume not head unless proven otherwise
  (SELECT id FROM public.departments LIMIT 1), -- Default department
  
  '[]'::jsonb, -- Empty participants for now
  false,
  
  false, -- Assume no budget unless costs in payload
  0,
  '[]'::jsonb,
  
  (tr.driver IS NOT NULL AND tr.driver != ''), -- Has vehicle if driver assigned
  CASE 
    WHEN tr.vehicle IS NOT NULL AND tr.vehicle != '' THEN tr.vehicle
    ELSE NULL
  END,
  NULL, -- No vehicle_id mapping
  NULL, -- No driver_id mapping
  
  map_old_status_to_new(tr.current_status)::request_status,
  CASE 
    WHEN map_old_status_to_new(tr.current_status) = 'pending_head' THEN 'head'
    WHEN map_old_status_to_new(tr.current_status) = 'pending_admin' THEN 'admin'
    ELSE NULL
  END,
  
  NULL, -- No head approval timestamp in old table
  NULL, -- No admin processed timestamp
  
  tr.rejected_at,
  NULL -- No rejected_by in old table
  
FROM public.travel_requests tr
WHERE NOT EXISTS (
  SELECT 1 FROM public.requests r WHERE r.id = tr.id
);

-- Step 5: Create migration log
CREATE TABLE IF NOT EXISTS public.migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name VARCHAR(255),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rows_affected INT,
  notes TEXT
);

INSERT INTO public.migration_log (migration_name, rows_affected, notes)
SELECT 
  'travel_requests_to_requests',
  COUNT(*),
  'Migrated travel_requests to new requests table with workflow support'
FROM public.requests
WHERE created_at >= (SELECT MAX(executed_at) FROM public.migration_log WHERE migration_name = 'travel_requests_to_requests');

-- Step 6: Verify migration
SELECT 
  'Old table count' as source,
  COUNT(*) as count
FROM public.travel_requests
UNION ALL
SELECT 
  'New table count' as source,
  COUNT(*) as count
FROM public.requests;

-- Step 7: Show sample migrated data
SELECT 
  id,
  request_number,
  title,
  status,
  created_at
FROM public.requests
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- OPTIONAL: Drop old table after verification
-- ============================================
-- UNCOMMENT ONLY AFTER VERIFYING MIGRATION IS SUCCESSFUL!
-- DROP TABLE IF EXISTS public.travel_requests CASCADE;

-- ============================================
-- DONE!
-- ============================================
COMMENT ON TABLE public.requests IS 'Main travel requests table with complete workflow support - migrated from travel_requests';
