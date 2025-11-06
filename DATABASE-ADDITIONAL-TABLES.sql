-- ============================================
-- ADDITIONAL TABLES FOR TRAVILINK SYSTEM
-- Drivers, Vehicles, Feedback, Trips
-- ============================================

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehicle Info
  name VARCHAR(100) NOT NULL, -- e.g., "L300 Van"
  plate_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., "ABC-1234"
  type VARCHAR(50) NOT NULL, -- "Van", "Bus", "Car"
  capacity INT NOT NULL, -- Number of passengers
  
  -- Status
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'retired'
  
  -- Maintenance Info
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  mileage_km DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_type ON public.vehicles(type);

-- ============================================
-- DRIVERS TABLE
-- Note: Drivers are users with role='driver'
-- This table stores additional driver-specific info
-- ============================================
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- License Info
  license_number VARCHAR(100) NOT NULL,
  license_expiry DATE,
  
  -- Capabilities
  can_drive_types VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[], -- ["Van", "Bus", "Car"]
  
  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Performance
  total_trips INT DEFAULT 0,
  badges VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[], -- ["safe_driver", "veteran", etc.]
  
  -- Contact
  phone VARCHAR(50),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(50),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_driver_profiles_user ON public.driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_available ON public.driver_profiles(is_available);

-- ============================================
-- TRIPS/SCHEDULE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trip Info
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  driver_id UUID REFERENCES public.users(id),
  
  -- Trip Details
  department_id UUID REFERENCES public.departments(id),
  destination VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  
  -- Dates & Times
  trip_date DATE NOT NULL,
  departure_time TIME,
  return_time TIME,
  actual_departure_time TIME,
  actual_return_time TIME,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Distance & Fuel
  distance_km DECIMAL(10,2),
  fuel_used_liters DECIMAL(10,2),
  starting_mileage DECIMAL(10,2),
  ending_mileage DECIMAL(10,2),
  
  -- Passengers
  passenger_count INT DEFAULT 0,
  passenger_names TEXT[], -- Array of passenger names
  
  -- Notes
  driver_notes TEXT,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_trip_times CHECK (
    actual_return_time IS NULL OR actual_departure_time IS NULL OR actual_return_time >= actual_departure_time
  )
);

CREATE INDEX idx_trips_date ON public.trips(trip_date);
CREATE INDEX idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX idx_trips_driver ON public.trips(driver_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_request ON public.trips(request_id);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Feedback Info
  user_id UUID REFERENCES public.users(id),
  user_name VARCHAR(255), -- For anonymous or guest feedback
  message TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  
  -- Status
  status VARCHAR(50) DEFAULT 'NEW', -- 'NEW', 'REVIEWED', 'RESOLVED'
  
  -- Admin Response
  admin_response TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_user ON public.feedback(user_id);
CREATE INDEX idx_feedback_created ON public.feedback(created_at DESC);

-- ============================================
-- VEHICLE MAINTENANCE LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  -- Maintenance Details
  maintenance_type VARCHAR(100) NOT NULL, -- 'routine', 'repair', 'inspection'
  description TEXT NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  
  -- Dates
  scheduled_date DATE,
  completed_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
  
  -- Personnel
  performed_by VARCHAR(255),
  mechanic_shop VARCHAR(255),
  
  -- Parts & Services
  parts_replaced TEXT[],
  services_performed TEXT[],
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_vehicle ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX idx_maintenance_status ON public.vehicle_maintenance(status);

-- ============================================
-- TRIGGER: Auto-update timestamps
-- ============================================
CREATE TRIGGER vehicles_update_timestamp
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER driver_profiles_update_timestamp
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trips_update_timestamp
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER feedback_update_timestamp
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER vehicle_maintenance_update_timestamp
  BEFORE UPDATE ON public.vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================
-- DONE!
-- ============================================
-- This schema adds:
-- ✅ Vehicles management
-- ✅ Driver profiles
-- ✅ Trip scheduling and tracking
-- ✅ Feedback system
-- ✅ Vehicle maintenance tracking
