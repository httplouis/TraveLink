-- ========================================
-- ADD REMAINING TABLES FOR 100% MIGRATION
-- ========================================
-- Run this in Supabase SQL Editor
-- This adds tables for features still using localStorage

-- 1. MAINTENANCE RECORDS
-- ========================================
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  -- Maintenance info
  maintenance_type TEXT NOT NULL, -- 'oil_change', 'tire_rotation', 'brake_service', 'general_checkup', 'repair', 'other'
  description TEXT NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  
  -- Scheduling
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  next_service_date TIMESTAMP WITH TIME ZONE,
  
  -- Personnel
  performed_by TEXT, -- Mechanic or service center name
  approved_by UUID REFERENCES public.users(id),
  
  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Details
  odometer_reading INTEGER,
  parts_replaced JSONB, -- Array of parts: [{part: 'oil filter', quantity: 1, cost: 500}]
  notes TEXT,
  attachments JSONB, -- Array of file URLs
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FEEDBACK / RATINGS
-- ========================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who gave feedback
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL, -- Cached for display
  user_email TEXT,
  
  -- Related to
  trip_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(user_id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  
  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  category TEXT, -- 'service', 'driver', 'vehicle', 'app', 'general'
  
  -- Admin response
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'resolved', 'archived'
  admin_response TEXT,
  responded_by UUID REFERENCES public.users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NOTIFICATIONS / INBOX
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL, -- 'request_approved', 'request_rejected', 'trip_assigned', 'maintenance_due', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity
  related_type TEXT, -- 'request', 'trip', 'vehicle', 'maintenance'
  related_id UUID,
  
  -- Action
  action_url TEXT, -- Link to view details
  action_label TEXT, -- Button text like "View Request"
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Priority
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- Auto-delete after this date
);

-- 4. ADMIN SCHEDULE / TRIPS (if not exists)
-- ========================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links to request
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  
  -- Assignment
  driver_id UUID REFERENCES public.drivers(user_id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  
  -- Schedule
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_departure TIMESTAMP WITH TIME ZONE,
  actual_return TIMESTAMP WITH TIME ZONE,
  
  -- Trip details
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  
  -- Participants
  passengers JSONB, -- Array of user info
  passenger_count INTEGER DEFAULT 1,
  
  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Post-trip
  distance_km DECIMAL(10,2),
  fuel_used DECIMAL(10,2),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (return_date >= departure_date)
);

-- 5. USER PROFILES (additional fields)
-- ========================================
-- Add columns to existing users table if needed
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 6. DRIVER PROFILES (additional fields)
-- ========================================
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact JSONB, -- {name, phone, relationship}
ADD COLUMN IF NOT EXISTS vehicle_assignments JSONB; -- Preferred vehicles

-- 7. ACTIVITY LOGS / AUDIT TRAIL
-- ========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who did what
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  
  -- Action details
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', etc.
  entity_type TEXT NOT NULL, -- 'request', 'vehicle', 'driver', 'user', etc.
  entity_id UUID,
  
  -- Changes
  changes JSONB, -- Before/after values
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. EXPORT HISTORY
-- ========================================
CREATE TABLE IF NOT EXISTS public.export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who exported
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  
  -- Export details
  export_type TEXT NOT NULL, -- 'requests', 'trips', 'maintenance', 'feedback', etc.
  format TEXT NOT NULL, -- 'csv', 'excel', 'pdf'
  filters JSONB, -- What filters were applied
  
  -- File info
  file_name TEXT NOT NULL,
  file_size INTEGER,
  download_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- Auto-delete file after this
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance_records(scheduled_date);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_driver ON public.feedback(driver_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_request ON public.trips(request_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON public.trips(departure_date);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.activity_logs(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY (Optional - keep disabled for internal app)
-- ========================================

-- Disable RLS for simplicity (internal app)
ALTER TABLE public.maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history DISABLE ROW LEVEL SECURITY;

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Sample maintenance record
INSERT INTO public.maintenance_records (vehicle_id, maintenance_type, description, cost, scheduled_date, status, performed_by)
SELECT 
  v.id,
  'oil_change',
  'Regular 5000km oil change service',
  2500.00,
  NOW() + INTERVAL '7 days',
  'scheduled',
  'AutoCare Service Center'
FROM public.vehicles v
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample feedback
INSERT INTO public.feedback (user_name, user_email, message, rating, category, status)
VALUES 
  ('Test User', 'test@example.com', 'Great service! Driver was very professional.', 5, 'service', 'new'),
  ('Another User', 'user2@example.com', 'Vehicle was clean and comfortable.', 4, 'vehicle', 'new')
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
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

-- Check row counts
SELECT 
  'maintenance_records' as table_name, COUNT(*) as row_count FROM public.maintenance_records
UNION ALL
SELECT 'feedback', COUNT(*) FROM public.feedback
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'trips', COUNT(*) FROM public.trips
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM public.activity_logs
UNION ALL
SELECT 'export_history', COUNT(*) FROM public.export_history;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
-- If you see this, all tables were created successfully!
-- Next: Run the application and test the new features!
-- ========================================
