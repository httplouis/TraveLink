-- ============================================================================
-- TraviLink APPLICATION TABLES
-- Migration: MockData → Real Database
-- ============================================================================

-- ============================================================================
-- 1. REQUEST DRAFTS (Replace localStorage drafts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.request_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_user ON public.request_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_updated ON public.request_drafts(updated_at DESC);

COMMENT ON TABLE public.request_drafts IS 'User request drafts - replaces localStorage storage';

-- ============================================================================
-- 2. TRAVEL REQUESTS (Main requests table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.travel_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Basic Info
    purpose TEXT NOT NULL,
    destination TEXT NOT NULL,
    origin TEXT NOT NULL,
    
    -- Travel Details
    travel_date DATE NOT NULL,
    travel_time TIME NOT NULL,
    return_date DATE,
    return_time TIME,
    
    -- Status & Workflow
    current_status VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- Status: draft, pending_head, pending_hr, pending_exec, approved, rejected, cancelled
    
    -- Full payload (JSONB for flexibility)
    payload JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_requests_user ON public.travel_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.travel_requests(current_status);
CREATE INDEX IF NOT EXISTS idx_requests_date ON public.travel_requests(travel_date);
CREATE INDEX IF NOT EXISTS idx_requests_number ON public.travel_requests(request_number);

COMMENT ON TABLE public.travel_requests IS 'Main travel order requests';

-- ============================================================================
-- 3. VEHICLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    model TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- van, bus, sedan, etc.
    capacity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    -- Status: available, in_use, maintenance, offline
    
    -- Details
    year INT,
    color VARCHAR(50),
    fuel_type VARCHAR(20),
    
    -- Maintenance
    last_maintenance DATE,
    next_maintenance DATE,
    mileage INT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate_number);

COMMENT ON TABLE public.vehicles IS 'University vehicles for transport';

-- ============================================================================
-- 4. DRIVER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Contact
    phone VARCHAR(20) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    
    -- License
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_type VARCHAR(20), -- professional, non-professional
    license_expiry DATE NOT NULL,
    
    -- Emergency Contact
    emergency_contact JSONB,
    -- { name: string, relationship: string, phone: string }
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    -- Status: active, on_leave, suspended, resigned
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_user ON public.driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.driver_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.driver_profiles(status);

COMMENT ON TABLE public.driver_profiles IS 'Driver profiles and license info';

-- ============================================================================
-- 5. TRIPS (Scheduled & Completed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.travel_requests(id),
    vehicle_id UUID REFERENCES public.vehicles(id),
    driver_id UUID REFERENCES public.users(id),
    
    -- Schedule
    scheduled_departure TIMESTAMP WITH TIME ZONE,
    scheduled_arrival TIMESTAMP WITH TIME ZONE,
    
    -- Actual
    actual_departure TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    
    -- Trip Details
    distance_km DECIMAL(10,2),
    fuel_consumed DECIMAL(10,2),
    route TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled',
    -- Status: scheduled, in_progress, completed, cancelled
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_request ON public.trips(request_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_date ON public.trips(scheduled_departure);

COMMENT ON TABLE public.trips IS 'Trip assignments and tracking';

-- ============================================================================
-- 6. FEEDBACK
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    
    -- Feedback Details
    type VARCHAR(20) NOT NULL,
    -- Type: complaint, suggestion, compliment, bug_report
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Rating (optional)
    rating INT CHECK (rating >= 1 AND rating <= 5),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- Status: pending, in_review, resolved, closed
    
    -- Admin Response
    response TEXT,
    responded_by UUID REFERENCES public.users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);

COMMENT ON TABLE public.feedback IS 'User feedback and complaints';

-- ============================================================================
-- 7. MAINTENANCE RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    
    -- Maintenance Details
    type VARCHAR(50) NOT NULL,
    -- Type: oil_change, tire_change, brake_repair, engine_repair, etc.
    description TEXT NOT NULL,
    
    -- Cost
    cost DECIMAL(10,2),
    
    -- Schedule
    date DATE NOT NULL,
    
    -- Provider
    technician TEXT,
    shop TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed',
    -- Status: scheduled, in_progress, completed, cancelled
    
    -- Documents
    receipt_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON public.maintenance_records(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_records(status);

COMMENT ON TABLE public.maintenance_records IS 'Vehicle maintenance history';

-- ============================================================================
-- 8. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Notification Content
    kind VARCHAR(20) NOT NULL,
    -- Kind: info, update, warning, success, error
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Link (optional)
    link TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

COMMENT ON TABLE public.notifications IS 'User notifications';

-- ============================================================================
-- 9. ACTIVITY LOGS (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    
    -- Action Details
    action VARCHAR(50) NOT NULL,
    -- Action: login, logout, create_request, approve_request, etc.
    entity_type VARCHAR(50),
    -- Entity: request, vehicle, driver, etc.
    entity_id UUID,
    
    -- Details
    description TEXT,
    metadata JSONB,
    
    -- Client Info
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs(created_at DESC);

COMMENT ON TABLE public.activity_logs IS 'User activity audit trail';

-- ============================================================================
-- 10. SEED SAMPLE DATA
-- ============================================================================

-- Sample Vehicles
INSERT INTO public.vehicles (plate_number, model, type, capacity, status, year) VALUES
    ('ABC-1234', 'Toyota Hiace Commuter', 'van', 15, 'available', 2022),
    ('XYZ-5678', 'Mitsubishi L300', 'van', 12, 'available', 2021),
    ('DEF-9012', 'Toyota Innova', 'van', 7, 'available', 2023),
    ('GHI-3456', 'Toyota Corolla', 'sedan', 4, 'available', 2022),
    ('JKL-7890', 'Nissan Urvan', 'van', 18, 'maintenance', 2020)
ON CONFLICT (plate_number) DO NOTHING;

-- Generate Sample Request Numbers Sequence
CREATE SEQUENCE IF NOT EXISTS request_number_seq START 1;

-- Function to generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('request_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request number
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL THEN
        NEW.request_number := generate_request_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_request_number
    BEFORE INSERT ON public.travel_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_request_number();

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_request_drafts_updated
    BEFORE UPDATE ON public.request_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_travel_requests_updated
    BEFORE UPDATE ON public.travel_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vehicles_updated
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_driver_profiles_updated
    BEFORE UPDATE ON public.driver_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trips_updated
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_feedback_updated
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_maintenance_updated
    BEFORE UPDATE ON public.maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Next: Create API endpoints to replace mockApi calls
-- ============================================================================
