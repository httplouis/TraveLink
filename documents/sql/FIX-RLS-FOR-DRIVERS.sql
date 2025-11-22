-- =====================================================
-- QUICK FIX: Disable RLS or Add Policies for Drivers
-- =====================================================

-- OPTION 1: Disable RLS completely (for testing)
-- Uncomment these if you want to test without RLS

ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Note: users table might already have RLS policies
-- Only disable if needed:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;


-- OPTION 2: Add permissive RLS policies (better for production)
-- Uncomment these if you want to keep RLS enabled

/*
-- Allow service role to read everything
CREATE POLICY "Service role can read all drivers"
ON drivers
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Authenticated users can read drivers"
ON drivers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anonymous can read drivers"
ON drivers
FOR SELECT
TO anon
USING (true);

-- Same for vehicles
CREATE POLICY "Service role can read all vehicles"
ON vehicles
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Authenticated users can read vehicles"
ON vehicles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anonymous can read vehicles"
ON vehicles
FOR SELECT
TO anon
USING (true);
*/

-- =====================================================
-- Verify RLS status after running this
-- =====================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('drivers', 'vehicles', 'users');
