-- ============================================
-- UPDATE FILE CODE GENERATION
-- Phase 3: Generate file_code with requester/driver names
-- ============================================

-- Function to generate file_code for travel orders
CREATE OR REPLACE FUNCTION generate_travel_order_file_code(
  p_request_id UUID,
  p_request_number VARCHAR(50),
  p_requester_name TEXT,
  p_driver_name TEXT DEFAULT NULL,
  p_department_name TEXT DEFAULT NULL,
  p_participants JSONB DEFAULT '[]'::jsonb
)
RETURNS VARCHAR(100) AS $$
DECLARE
  year_part VARCHAR(4);
  sequence_part VARCHAR(10);
  requester_part TEXT;
  driver_part TEXT;
  result VARCHAR(100);
BEGIN
  -- Extract year and sequence from request_number (e.g., TO-2025-800)
  year_part := SPLIT_PART(p_request_number, '-', 2);
  sequence_part := SPLIT_PART(p_request_number, '-', 3);
  
  -- Determine requester part
  -- If multiple participants (more than 1), use department name
  -- Otherwise use requester name
  IF jsonb_array_length(COALESCE(p_participants, '[]'::jsonb)) > 1 THEN
    -- Multiple requesters: use department name
    requester_part := COALESCE(
      UPPER(REGEXP_REPLACE(p_department_name, '[^A-Z0-9]', '', 'g')),
      UPPER(REGEXP_REPLACE(p_requester_name, '[^A-Z0-9]', '', 'g'))
    );
  ELSE
    -- Single requester: use requester name (uppercase, no spaces)
    requester_part := UPPER(REGEXP_REPLACE(p_requester_name, '[^A-Z0-9]', '', 'g'));
  END IF;
  
  -- Driver part (if assigned)
  IF p_driver_name IS NOT NULL AND p_driver_name != '' THEN
    driver_part := UPPER(REGEXP_REPLACE(p_driver_name, '[^A-Z0-9]', '', 'g'));
  ELSE
    driver_part := 'TBD';
  END IF;
  
  -- Build file code: TO-2025-800-JUANDELACRUZ-PEDROSANTOS
  result := 'TO-' || year_part || '-' || sequence_part || '-' || requester_part || '-' || driver_part;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate seminar codes per person
CREATE OR REPLACE FUNCTION generate_seminar_codes(
  p_request_number VARCHAR(50),
  p_participants JSONB
)
RETURNS JSONB AS $$
DECLARE
  year_part VARCHAR(4);
  sequence_part VARCHAR(10);
  result JSONB := '[]'::jsonb;
  participant JSONB;
  person_code JSONB;
  person_name_clean TEXT;
BEGIN
  -- Extract year and sequence from request_number (e.g., SEM-2025-200)
  year_part := SPLIT_PART(p_request_number, '-', 2);
  sequence_part := SPLIT_PART(p_request_number, '-', 3);
  
  -- Generate code for each participant
  FOR participant IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    -- Get person name (could be from different fields)
    person_name_clean := UPPER(REGEXP_REPLACE(
      COALESCE(
        participant->>'name',
        participant->>'requester_name',
        'UNKNOWN'
      ),
      '[^A-Z0-9]', '', 'g'
    ));
    
    -- Build code: SA-2025-200-JUANDELACRUZ
    person_code := jsonb_build_object(
      'person_id', participant->>'id',
      'name', participant->>'name',
      'code', 'SA-' || year_part || '-' || sequence_part || '-' || person_name_clean
    );
    
    result := result || jsonb_build_array(person_code);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update file_code after request is created/updated
CREATE OR REPLACE FUNCTION update_file_code()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
  driver_name TEXT;
  department_name TEXT;
  participants_data JSONB;
BEGIN
  -- Only update if file_code is not already set
  IF NEW.file_code IS NULL THEN
    -- Get requester name
    SELECT name INTO requester_name
    FROM public.users
    WHERE id = NEW.requester_id;
    
    -- Get driver name (if assigned)
    IF NEW.assigned_driver_id IS NOT NULL THEN
      SELECT name INTO driver_name
      FROM public.users
      WHERE id = NEW.assigned_driver_id;
    END IF;
    
    -- Get department name
    IF NEW.department_id IS NOT NULL THEN
      SELECT name INTO department_name
      FROM public.departments
      WHERE id = NEW.department_id;
    END IF;
    
    -- Get participants
    participants_data := COALESCE(NEW.participants, '[]'::jsonb);
    
    -- Generate file_code based on request type
    IF NEW.request_type = 'travel_order' THEN
      NEW.file_code := generate_travel_order_file_code(
        NEW.id,
        NEW.request_number,
        COALESCE(requester_name, NEW.requester_name, 'UNKNOWN'),
        driver_name,
        department_name,
        participants_data
      );
    ELSIF NEW.request_type = 'seminar' THEN
      -- For seminars, generate per-person codes
      NEW.seminar_code_per_person := generate_seminar_codes(
        NEW.request_number,
        participants_data
      );
      -- Also set file_code to first person's code (for backward compatibility)
      IF jsonb_array_length(participants_data) > 0 THEN
        NEW.file_code := (generate_seminar_codes(NEW.request_number, participants_data)->0->>'code');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update file_code on INSERT
DROP TRIGGER IF EXISTS update_file_code_trigger ON public.requests;
CREATE TRIGGER update_file_code_trigger
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  WHEN (NEW.file_code IS NULL)
  EXECUTE FUNCTION update_file_code();

-- Create separate trigger for UPDATE (when driver is assigned)
DROP TRIGGER IF EXISTS update_file_code_on_driver_trigger ON public.requests;
CREATE TRIGGER update_file_code_on_driver_trigger
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  WHEN (NEW.file_code IS NULL OR (NEW.assigned_driver_id IS DISTINCT FROM OLD.assigned_driver_id AND NEW.assigned_driver_id IS NOT NULL))
  EXECUTE FUNCTION update_file_code();

-- ============================================
-- VERIFICATION
-- ============================================

-- Test function
-- SELECT generate_travel_order_file_code(
--   '00000000-0000-0000-0000-000000000000'::UUID,
--   'TO-2025-800',
--   'Juan Dela Cruz',
--   'Pedro Santos',
--   'CCMS',
--   '[]'::jsonb
-- );
-- Expected: TO-2025-800-JUANDELACRUZ-PEDROSANTOS

-- SELECT generate_seminar_codes(
--   'SEM-2025-200',
--   '[{"name": "Juan Dela Cruz", "id": "123"}]'::jsonb
-- );
-- Expected: [{"person_id": "123", "name": "Juan Dela Cruz", "code": "SA-2025-200-JUANDELACRUZ"}]

-- Migration complete!

