-- ============================================
-- PARTICIPANT INVITATION SYSTEM FOR SEMINAR APPLICATIONS
-- ============================================
-- Run this in Supabase SQL Editor
-- This creates tables for managing participant invitations and confirmations

-- ============================================
-- 1. PARTICIPANT INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.participant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request reference
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  
  -- Participant info
  email TEXT NOT NULL,
  name TEXT, -- Will be populated when user confirms
  user_id UUID REFERENCES public.users(id), -- Will be set when user confirms (if they have account)
  
  -- Invitation details
  invited_by UUID NOT NULL REFERENCES public.users(id), -- The requester
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Confirmation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'expired')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  declined_reason TEXT,
  
  -- Participant details (filled when confirming)
  department TEXT,
  available_fdp INTEGER,
  signature TEXT, -- Base64 signature image
  
  -- Metadata
  token TEXT UNIQUE NOT NULL, -- Unique token for confirmation link
  expires_at TIMESTAMP WITH TIME ZONE, -- Invitation expiration (default 7 days)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participant_invitations_request_id ON public.participant_invitations(request_id);
CREATE INDEX IF NOT EXISTS idx_participant_invitations_email ON public.participant_invitations(email);
CREATE INDEX IF NOT EXISTS idx_participant_invitations_token ON public.participant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_participant_invitations_status ON public.participant_invitations(status);

-- ============================================
-- 2. UPDATE REQUESTS TABLE (if needed)
-- ============================================
-- Add column to track if all participants have confirmed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'requests' AND column_name = 'all_participants_confirmed'
    ) THEN
        ALTER TABLE public.requests ADD COLUMN all_participants_confirmed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'requests' AND column_name = 'participant_invitations_sent'
    ) THEN
        ALTER TABLE public.requests ADD COLUMN participant_invitations_sent BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.requests ADD COLUMN participant_invitations_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- 3. FUNCTION: Check if all participants confirmed
-- ============================================
-- Drop function if exists (for re-running the script)
DROP FUNCTION IF EXISTS check_all_participants_confirmed(UUID);

CREATE OR REPLACE FUNCTION check_all_participants_confirmed(request_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_invitations INTEGER;
  confirmed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_invitations
  FROM public.participant_invitations
  WHERE request_id = request_uuid;
  
  IF total_invitations = 0 THEN
    RETURN TRUE; -- No participants = automatically "confirmed"
  END IF;
  
  SELECT COUNT(*) INTO confirmed_count
  FROM public.participant_invitations
  WHERE request_id = request_uuid AND status = 'confirmed';
  
  RETURN confirmed_count = total_invitations;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGER: Auto-update all_participants_confirmed
-- ============================================
-- IMPORTANT: Drop trigger FIRST, then function (because trigger depends on function)
-- Drop trigger if it already exists (for re-running the script)
DROP TRIGGER IF EXISTS trigger_update_participants_confirmed ON public.participant_invitations;

-- Drop function if exists (for re-running the script)
DROP FUNCTION IF EXISTS update_participants_confirmed_status();

-- Create function
CREATE OR REPLACE FUNCTION update_participants_confirmed_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.requests
  SET all_participants_confirmed = check_all_participants_confirmed(NEW.request_id)
  WHERE id = NEW.request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (after function is created)
CREATE TRIGGER trigger_update_participants_confirmed
AFTER INSERT OR UPDATE OF status ON public.participant_invitations
FOR EACH ROW
EXECUTE FUNCTION update_participants_confirmed_status();

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON TABLE public.participant_invitations IS 'Tracks participant invitations for seminar applications';
COMMENT ON COLUMN public.participant_invitations.token IS 'Unique token for confirmation link (sent via email)';
COMMENT ON COLUMN public.participant_invitations.status IS 'pending: not yet responded, confirmed: accepted invitation, declined: rejected, expired: past expiration date';

