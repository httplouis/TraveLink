-- ========================================
-- ADD REMAINING TABLES FOR 100% MIGRATION
-- FIXED VERSION - Handles existing tables
-- ========================================

-- First, let's drop any conflicting tables (SAFE - only if empty)
-- Comment these out if you have data you want to keep!

-- DROP TABLE IF EXISTS public.maintenance_records CASCADE;
-- DROP TABLE IF EXISTS public.feedback CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.trips CASCADE;
-- DROP TABLE IF EXISTS public.activity_logs CASCADE;
-- DROP TABLE IF EXISTS public.export_history CASCADE;

-- ========================================
-- 1. MAINTENANCE RECORDS
-- ========================================
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  -- Maintenance info
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  next_service_date TIMESTAMPTZ,
  
  -- Personnel
  performed_by TEXT,
  approved_by UUID REFERENCES public.users(id),
  
  -- Status
  status TEXT DEFAULT 'scheduled',
  priority TEXT DEFAULT 'normal',
  
  -- Details
  odometer_reading INTEGER,
  parts_replaced JSONB,
  notes TEXT,
  attachments JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. FEEDBACK / RATINGS
-- ========================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who gave feedback
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  
  -- Related to
  trip_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  driver_id UUID,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  
  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  category TEXT,
  
  -- Admin response
  status TEXT DEFAULT 'new',
  admin_response TEXT,
  responded_by UUID REFERENCES public.users(id),
  responded_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. NOTIFICATIONS / INBOX
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification content
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity
  related_type TEXT,
  related_id UUID,
  
  -- Action
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Priority
  priority TEXT DEFAULT 'normal',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ========================================
-- 4. TRIPS (Scheduled/Active trips)
-- ========================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links to request
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  
  -- Assignment
  driver_id UUID,
  vehicle_id UUID REFERENCES public.vehicles(id),
  
  -- Schedule
  departure_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  actual_return TIMESTAMPTZ,
  
  -- Trip details
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  
  -- Participants
  passengers JSONB,
  passenger_count INTEGER DEFAULT 1,
  
  -- Status
  trip_status TEXT DEFAULT 'scheduled',
  
  -- Post-trip
  distance_km DECIMAL(10,2),
  fuel_used DECIMAL(10,2),
  trip_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_trip_dates CHECK (return_date >= departure_date)
);

-- ========================================
-- 5. ACTIVITY LOGS / AUDIT TRAIL
-- ========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who did what
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Changes
  changes JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 6. EXPORT HISTORY
-- ========================================
CREATE TABLE IF NOT EXISTS public.export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who exported
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  
  -- Export details
  export_type TEXT NOT NULL,
  export_format TEXT NOT NULL,
  filters JSONB,
  
  -- File info
  file_name TEXT NOT NULL,
  file_size INTEGER,
  download_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ========================================
-- ADD COLUMNS TO EXISTING TABLES (Safe - only adds if not exists)
-- ========================================

-- Users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='phone') THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='avatar_url') THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='preferences') THEN
    ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='last_login') THEN
    ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;
END $$;

-- Drivers table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='drivers' AND column_name='phone') THEN
    ALTER TABLE public.drivers ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='drivers' AND column_name='address') THEN
    ALTER TABLE public.drivers ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='drivers' AND column_name='emergency_contact') THEN
    ALTER TABLE public.drivers ADD COLUMN emergency_contact JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='drivers' AND column_name='vehicle_assignments') THEN
    ALTER TABLE public.drivers ADD COLUMN vehicle_assignments JSONB;
  END IF;
END $$;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Maintenance (safe - only creates if not exists)
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled ON public.maintenance_records(scheduled_date);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_request ON public.trips(request_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(trip_status);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON public.trips(departure_date);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.activity_logs(created_at DESC);

-- Export History
CREATE INDEX IF NOT EXISTS idx_export_user ON public.export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_created ON public.export_history(created_at DESC);

-- ========================================
-- DISABLE RLS (for internal app)
-- ========================================

ALTER TABLE IF EXISTS public.maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.export_history DISABLE ROW LEVEL SECURITY;

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Sample feedback (only if table is empty)
INSERT INTO public.feedback (user_name, user_email, message, rating, category, status)
SELECT 'Test User', 'test@example.com', 'Great service!', 5, 'service', 'new'
WHERE NOT EXISTS (SELECT 1 FROM public.feedback LIMIT 1);

-- ========================================
-- VERIFICATION
-- ========================================

-- Check what tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'maintenance_records', 
    'feedback', 
    'notifications', 
    'trips', 
    'activity_logs', 
    'export_history'
  )
ORDER BY table_name;

-- ========================================
-- SUCCESS!
-- ========================================
-- If no errors above, all tables created successfully!
-- Check the verification query results above
-- ========================================
