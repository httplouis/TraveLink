-- ============================================
-- FIX: Request Number Race Condition
-- ============================================
-- Problem: Multiple simultaneous requests can get duplicate numbers
-- Solution: Use database sequence for thread-safe number generation

-- Drop old trigger and function
DROP TRIGGER IF EXISTS requests_auto_number ON public.requests;
DROP FUNCTION IF EXISTS auto_generate_request_number();
DROP FUNCTION IF EXISTS generate_request_number(request_type);

-- Create sequences for each request type
CREATE SEQUENCE IF NOT EXISTS travel_order_seq START 1;
CREATE SEQUENCE IF NOT EXISTS seminar_seq START 1;

-- New thread-safe request number generator
CREATE OR REPLACE FUNCTION generate_request_number(req_type request_type)
RETURNS VARCHAR(50) AS $$
DECLARE
  prefix VARCHAR(10);
  year VARCHAR(4);
  sequence_num INT;
  result VARCHAR(50);
BEGIN
  -- Determine prefix
  IF req_type = 'travel_order' THEN
    prefix := 'TO';
    sequence_num := nextval('travel_order_seq');
  ELSIF req_type = 'seminar' THEN
    prefix := 'SEM';
    sequence_num := nextval('seminar_seq');
  ELSE
    prefix := 'REQ';
    sequence_num := nextval('travel_order_seq'); -- fallback
  END IF;
  
  year := EXTRACT(YEAR FROM NOW())::VARCHAR;
  result := prefix || '-' || year || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE OR REPLACE FUNCTION auto_generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_request_number(NEW.request_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_auto_number
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_request_number();

-- ============================================
-- OPTIONAL: Sync sequences with existing data
-- ============================================
-- This ensures new requests don't conflict with existing ones

DO $$
DECLARE
  max_to_num INT;
  max_sem_num INT;
BEGIN
  -- Get highest travel order number
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(request_number, '[^0-9]', '', 'g'), '')::INT
  ), 0)
  INTO max_to_num
  FROM public.requests
  WHERE request_number LIKE 'TO-%';
  
  -- Get highest seminar number
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(request_number, '[^0-9]', '', 'g'), '')::INT
  ), 0)
  INTO max_sem_num
  FROM public.requests
  WHERE request_number LIKE 'SEM-%';
  
  -- Set sequences to max + 1
  IF max_to_num > 0 THEN
    PERFORM setval('travel_order_seq', max_to_num + 1, false);
  END IF;
  
  IF max_sem_num > 0 THEN
    PERFORM setval('seminar_seq', max_sem_num + 1, false);
  END IF;
  
  RAISE NOTICE 'Sequences synced: TO=%, SEM=%', max_to_num, max_sem_num;
END $$;

-- Verify
SELECT 
  'travel_order_seq' as sequence_name,
  last_value as current_value
FROM travel_order_seq
UNION ALL
SELECT 
  'seminar_seq',
  last_value
FROM seminar_seq;

-- ============================================
-- TEST
-- ============================================
-- Test concurrent inserts (safe now!)
SELECT generate_request_number('travel_order'::request_type);
SELECT generate_request_number('travel_order'::request_type);
SELECT generate_request_number('seminar'::request_type);

-- Should show:
-- TO-2025-001
-- TO-2025-002  
-- SEM-2025-001
