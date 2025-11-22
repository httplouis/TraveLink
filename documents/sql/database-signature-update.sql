-- Add signature column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='signature') THEN
        ALTER TABLE public.users ADD COLUMN signature TEXT;
        COMMENT ON COLUMN public.users.signature IS 'Base64-encoded digital signature image';
    END IF;
END $$;

-- Add approved_at column to approvals table
-- Note: Skip if approvals is a view instead of a table
DO $$ 
BEGIN
    -- Check if approvals is a table (not a view)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='approvals' AND table_type='BASE TABLE'
    ) THEN
        -- Add column only if table exists and column doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='approvals' AND column_name='approved_at'
        ) THEN
            ALTER TABLE public.approvals ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    ELSE
        RAISE NOTICE 'approvals is a view or does not exist, skipping approved_at column';
    END IF;
END $$;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'signature';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'approvals' AND column_name = 'approved_at';
