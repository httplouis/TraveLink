-- ============================================
-- REQUESTER INVITATION SYSTEM FOR MULTIPLE REQUESTERS
-- ============================================
-- Run this in Supabase SQL Editor
-- This creates tables for managing requester invitations and confirmations
-- Similar to participant_invitations but for multiple requesters in travel orders

-- ============================================
-- 1. REQUESTER INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.requester_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request reference
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  
  -- Requester info
  email TEXT NOT NULL,
  name TEXT, -- Will be populated when user confirms
  user_id UUID REFERENCES public.users(id), -- Will be set when user confirms (if they have account)
  
  -- Invitation details
  invited_by UUID NOT NULL REFERENCES public.users(id), -- The person who added this requester
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Confirmation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'expired')),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  declined_reason TEXT,
  
  -- Requester details (filled when confirming)
  department TEXT,
  department_id UUID REFERENCES public.departments(id),
  signature TEXT, -- Base64 signature image
  
  -- Metadata
  token TEXT UNIQUE NOT NULL, -- Unique token for confirmation link
  expires_at TIMESTAMP WITH TIME ZONE, -- Invitation expiration (default 7 days)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_requester_invitations_request_id ON public.requester_invitations(request_id);
CREATE INDEX IF NOT EXISTS idx_requester_invitations_email ON public.requester_invitations(email);
CREATE INDEX IF NOT EXISTS idx_requester_invitations_token ON public.requester_invitations(token);
CREATE INDEX IF NOT EXISTS idx_requester_invitations_status ON public.requester_invitations(status);
CREATE INDEX IF NOT EXISTS idx_requester_invitations_user_id ON public.requester_invitations(user_id);

-- ============================================
-- 2. UPDATE REQUESTS TABLE (if needed)
-- ============================================
-- Add column to track if all requesters have confirmed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'requests' AND column_name = 'all_requesters_confirmed'
    ) THEN
        ALTER TABLE public.requests ADD COLUMN all_requesters_confirmed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'requests' AND column_name = 'requester_invitations_sent'
    ) THEN
        ALTER TABLE public.requests ADD COLUMN requester_invitations_sent BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.requests ADD COLUMN requester_invitations_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- 3. FUNCTION: Check if all requesters confirmed
-- ============================================
DROP FUNCTION IF EXISTS check_all_requesters_confirmed(UUID);

CREATE OR REPLACE FUNCTION check_all_requesters_confirmed(request_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_invitations INTEGER;
  confirmed_count INTEGER;
BEGIN
  -- Count total invitations for this request
  SELECT COUNT(*) INTO total_invitations
  FROM public.requester_invitations
  WHERE request_id = request_uuid;
  
  -- If no invitations, return true (nothing to confirm)
  IF total_invitations = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Count confirmed invitations
  SELECT COUNT(*) INTO confirmed_count
  FROM public.requester_invitations
  WHERE request_id = request_uuid
    AND status = 'confirmed';
  
  -- Return true if all are confirmed
  RETURN confirmed_count = total_invitations;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGER: Auto-update all_requesters_confirmed
-- ============================================
DROP TRIGGER IF EXISTS trg_update_all_requesters_confirmed ON public.requester_invitations;

CREATE TRIGGER trg_update_all_requesters_confirmed
AFTER INSERT OR UPDATE OR DELETE ON public.requester_invitations
FOR EACH ROW
EXECUTE FUNCTION update_all_requesters_confirmed();

-- Function for trigger
CREATE OR REPLACE FUNCTION update_all_requesters_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  request_uuid UUID;
BEGIN
  -- Get request_id from the row
  IF TG_OP = 'DELETE' THEN
    request_uuid := OLD.request_id;
  ELSE
    request_uuid := NEW.request_id;
  END IF;
  
  -- Update the requests table
  UPDATE public.requests
  SET all_requesters_confirmed = check_all_requesters_confirmed(request_uuid)
  WHERE id = request_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. RLS POLICIES
-- ============================================
-- Enable RLS
ALTER TABLE public.requester_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invitations (by email or user_id)
DROP POLICY IF EXISTS requester_invitations_select_own ON public.requester_invitations;
CREATE POLICY requester_invitations_select_own ON public.requester_invitations
  FOR SELECT
  USING (
    -- User can see invitations sent to their email
    email = (SELECT email FROM public.users WHERE auth_user_id = auth.uid())
    OR
    -- User can see invitations for their user_id
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR
    -- Inviter can see invitations they sent
    invited_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Policy: Service role has full access
DROP POLICY IF EXISTS requester_invitations_service_role_all ON public.requester_invitations;
CREATE POLICY requester_invitations_service_role_all ON public.requester_invitations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can insert (when inviting)
DROP POLICY IF EXISTS requester_invitations_insert_authenticated ON public.requester_invitations;
CREATE POLICY requester_invitations_insert_authenticated ON public.requester_invitations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own invitations (to confirm/decline)
DROP POLICY IF EXISTS requester_invitations_update_own ON public.requester_invitations;
CREATE POLICY requester_invitations_update_own ON public.requester_invitations
  FOR UPDATE
  USING (
    email = (SELECT email FROM public.users WHERE auth_user_id = auth.uid())
    OR
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- 6. VERIFICATION
-- ============================================
-- Check if table was created
SELECT 
  'requester_invitations table created' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'requester_invitations';

-- Check indexes
SELECT 
  'Indexes created' AS status,
  indexname
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'requester_invitations';

