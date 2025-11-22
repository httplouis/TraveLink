-- ===============================================
-- Fix: Check and Add Storage Columns
-- ===============================================

-- First, check what columns exist in users table
-- Run this to see current columns:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- ===============================================
-- Add columns ONLY if they don't exist
-- ===============================================

-- Add avatar_url (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Add signature_url (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'signature_url'
    ) THEN
        ALTER TABLE users ADD COLUMN signature_url TEXT;
    END IF;
END $$;

-- ===============================================
-- Optional: Add to vehicles table for maintenance
-- ===============================================

-- Add maintenance_photos array (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'maintenance_photos'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN maintenance_photos TEXT[];
    END IF;
END $$;

-- ===============================================
-- Verify the changes
-- ===============================================

-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('avatar_url', 'signature_url');

-- Check vehicles table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
AND column_name = 'maintenance_photos';
