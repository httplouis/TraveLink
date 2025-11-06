-- Check the 5 most recent requests to see if preferences are being saved
SELECT 
  request_number,
  requester_name,
  preferred_driver_id,
  preferred_vehicle_id,
  submitted_by_name,
  is_representative,
  vehicle_type,
  created_at
FROM requests
ORDER BY created_at DESC
LIMIT 5;

-- If ALL show NULL for preferred_vehicle_id, then QuickFill isn't sending data properly
-- If SOME have UUIDs, then it's working for those!

-- Expected result after fix:
-- preferred_driver_id: NULL (QuickFill doesn't set this anymore)
-- preferred_vehicle_id: 0e9dc284-d380-46a7-... (real UUID)
