-- ============================================================================
-- Vehicle Maintenance System Schema
-- Based on Philippines LTO requirements and maintenance best practices
-- ============================================================================

-- Main maintenance records table
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  -- Maintenance Type
  maintenance_type VARCHAR(50) NOT NULL,
  -- Types: oil_change, lto_renewal, pmo, emission_test, mvir, insurance_renewal, 
  --        ltfrb_renewal, tire_change, brake_service, filter_change, 
  --        battery_replacement, inspection, repair, other
  
  -- Document Type (for LTO/regulatory documents)
  document_type VARCHAR(50),
  -- Types: CR, OR, CEC, MVIR, Insurance_COC, LTFRB_CPC, etc.
  
  -- Dates
  due_date DATE NOT NULL,
  completed_date DATE,
  reminder_date DATE, -- For manual reminders
  
  -- Cost and Status
  cost DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  -- Status: pending, completed, overdue, cancelled
  
  -- Reminder Settings
  reminder_type VARCHAR(20) DEFAULT 'auto',
  -- Type: auto (predictive), manual (user-set date)
  
  -- Attachments (documents, receipts, photos)
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Array of {url, name, type, uploaded_at}
  
  -- Details
  description TEXT,
  notes TEXT,
  service_provider VARCHAR(255), -- Garage, LTO office, etc.
  odometer_reading INTEGER, -- For mileage-based maintenance
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (completed_date IS NULL OR completed_date >= due_date),
  CONSTRAINT valid_reminder CHECK (reminder_date IS NULL OR reminder_date <= due_date)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.vehicle_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_due_date ON public.vehicle_maintenance(due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON public.vehicle_maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_by ON public.vehicle_maintenance(created_by);

-- Document Library Table (for storing all vehicle-related documents)
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_id UUID REFERENCES public.vehicle_maintenance(id) ON DELETE SET NULL,
  
  -- Document Info
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- pdf, image, etc.
  file_size BIGINT, -- in bytes
  
  -- Metadata
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  tags TEXT[], -- For categorization/search
  
  -- Expiry tracking (for documents with expiry dates)
  expiry_date DATE,
  is_expired BOOLEAN GENERATED ALWAYS AS (expiry_date < CURRENT_DATE) STORED
);

CREATE INDEX IF NOT EXISTS idx_documents_vehicle ON public.vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_maintenance ON public.vehicle_documents(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.vehicle_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.vehicle_documents(expiry_date);

-- Maintenance History (audit trail)
CREATE TABLE IF NOT EXISTS public.maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES public.vehicle_maintenance(id) ON DELETE CASCADE,
  
  action VARCHAR(50) NOT NULL, -- created, updated, completed, cancelled
  actor_id UUID REFERENCES public.users(id),
  actor_role VARCHAR(50),
  
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  
  comments TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_history_maintenance ON public.maintenance_history(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_actor ON public.maintenance_history(actor_id);

-- Comments
COMMENT ON TABLE public.vehicle_maintenance IS 'Vehicle maintenance records with predictive scheduling support';
COMMENT ON TABLE public.vehicle_documents IS 'Library of all vehicle-related documents (CR, OR, insurance, etc.)';
COMMENT ON TABLE public.maintenance_history IS 'Audit trail for maintenance record changes';

