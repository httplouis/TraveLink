-- Add requester_name column to requests table
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255);

-- Update existing requests with requester name from users table
UPDATE public.requests r
SET requester_name = u.name
FROM public.users u
WHERE r.requester_id = u.id
  AND r.requester_name IS NULL;

-- Verify
SELECT 
  id,
  requester_name,
  requester_id,
  status
FROM public.requests
ORDER BY created_at DESC
LIMIT 5;
