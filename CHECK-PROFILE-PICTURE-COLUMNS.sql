-- ===============================================
-- Check Profile Picture Columns in Users Table
-- ===============================================

-- Check if avatar_url column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('avatar_url', 'profile_picture');

-- If avatar_url doesn't exist, add it:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- If profile_picture doesn't exist, add it:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Verify both columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('avatar_url', 'profile_picture');

