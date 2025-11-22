-- ============================================
-- ADD SMS AND CONTACT NUMBER FIELDS
-- Phase 1.2: Add contact number and SMS tracking fields
-- ============================================

-- Add requester contact number
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS requester_contact_number TEXT;

-- Add driver contact number (for SMS notifications)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS driver_contact_number TEXT;

-- Add SMS notification tracking
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS sms_notification_sent BOOLEAN DEFAULT FALSE;

-- Add SMS sent timestamp
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.requests.requester_contact_number IS 'Contact number of requester for driver coordination (Philippines format: +63XXXXXXXXXX or 09XXXXXXXXX)';
COMMENT ON COLUMN public.requests.driver_contact_number IS 'Contact number of assigned driver for SMS notifications';
COMMENT ON COLUMN public.requests.sms_notification_sent IS 'Flag indicating if SMS notification was sent to driver';
COMMENT ON COLUMN public.requests.sms_sent_at IS 'Timestamp when SMS notification was sent';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN (
    'requester_contact_number',
    'driver_contact_number',
    'sms_notification_sent',
    'sms_sent_at'
  )
ORDER BY column_name;

-- Migration complete!

