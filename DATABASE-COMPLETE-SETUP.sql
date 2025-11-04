-- ============================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Run this to set up everything in correct order
-- ============================================

-- This script runs in order:
-- 1. Create workflow tables and enums
-- 2. Add RLS policies
-- 3. Migrate old data (if exists)
-- 4. Insert test users
-- 5. Verify everything

\echo '================================================'
\echo 'TraviLink Database Setup - Starting...'
\echo '================================================'

\echo ''
\echo 'Step 1: Creating workflow schema...'
\i DATABASE-WORKFLOW-SCHEMA.sql

\echo ''
\echo 'Step 2: Adding RLS policies...'
\i DATABASE-RLS-POLICIES.sql

\echo ''
\echo 'Step 3: Migrating old data (if exists)...'
\i DATABASE-MIGRATION.sql

\echo ''
\echo 'Step 4: Creating test users...'
\i FINAL-INSERT-USERS.sql

\echo ''
\echo '================================================'
\echo 'Setup Complete! Summary:'
\echo '================================================'

-- Show counts
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Departments' as table_name, COUNT(*) as count FROM public.departments
UNION ALL
SELECT 'Requests' as table_name, COUNT(*) as count FROM public.requests
UNION ALL
SELECT 'Request History' as table_name, COUNT(*) as count FROM public.request_history;

\echo ''
\echo 'Test Accounts Available:'
\echo '========================'
\echo 'Admin (TM):      admin@mseuf.edu.ph / Admin@123'
\echo 'Admin (Cleofe):  admin.cleofe@mseuf.edu.ph / Admin@123'
\echo 'Executive:       exec.president@mseuf.edu.ph / Exec@123'
\echo 'HR:              hr.admin@mseuf.edu.ph / HR@123'
\echo 'Comptroller:     comptroller@mseuf.edu.ph / Comp@123'
\echo 'Head:            head.nursing@mseuf.edu.ph / Head@123'
\echo 'Faculty:         faculty@mseuf.edu.ph / Faculty@123'

\echo ''
\echo '✅ All done! System ready to use.'
