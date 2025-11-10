-- ═══════════════════════════════════════════════════════════════════════
-- ADD PASSWORDS TO VP AND PRESIDENT ACCOUNTS
-- Run this AFTER running EXECUTIVE-ROLE-MIGRATION.sql
-- ═══════════════════════════════════════════════════════════════════════

-- IMPORTANT: Replace the password hashes below with actual bcrypt hashes!
-- Use your application's password hashing function

-- Method 1: Using bcrypt in Node.js
-- const bcrypt = require('bcrypt');
-- const vpHash = await bcrypt.hash('VP@2025', 10);
-- const presidentHash = await bcrypt.hash('President@2025', 10);

-- Method 2: Using online bcrypt tool
-- Go to: https://bcrypt-generator.com/
-- Input: VP@2025
-- Rounds: 10
-- Copy the hash and paste below

-- ═══════════════════════════════════════════════════════════════════════
-- OPTION 1: If your table uses 'password' column
-- ═══════════════════════════════════════════════════════════════════════

-- UPDATE users 
-- SET password = '$2a$10$REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_VP'
-- WHERE email = 'vp@emiliouniversity.edu.ph';

-- UPDATE users 
-- SET password = '$2a$10$REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_PRESIDENT'
-- WHERE email = 'president@emiliouniversity.edu.ph';

-- ═══════════════════════════════════════════════════════════════════════
-- OPTION 2: If your table uses 'password_hash' column
-- ═══════════════════════════════════════════════════════════════════════

UPDATE users 
SET password_hash = '$2a$10$REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_VP'
WHERE email = 'vp@mseuf.edu.ph';

UPDATE users 
SET password_hash = '$2a$10$REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_PRESIDENT'
WHERE email = 'president@mseuf.edu.ph';

-- ═══════════════════════════════════════════════════════════════════════
-- OPTION 3: If your table uses 'hashed_password' column
-- ═══════════════════════════════════════════════════════════════════════

-- UPDATE users 
-- SET hashed_password = '$2a$10$REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_VP'
-- WHERE email = 'vp@emiliouniversity.edu.ph';

-- UPDATE users 
-- SET hashed_password = '$2a$10$REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_PRESIDENT'
-- WHERE email = 'president@emiliouniversity.edu.ph';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════

-- Check if passwords were set (will show TRUE if password exists)
SELECT 
  email,
  name,
  is_vp,
  is_president,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password Set ✓'
    ELSE 'No Password ✗'
  END as password_status
FROM users 
WHERE email IN ('vp@mseuf.edu.ph', 'president@mseuf.edu.ph');

-- ═══════════════════════════════════════════════════════════════════════
-- QUICK BCRYPT GENERATION (Node.js)
-- ═══════════════════════════════════════════════════════════════════════

/*
// Run this in Node.js to generate hashes:

const bcrypt = require('bcrypt');

async function generateHashes() {
  const vpHash = await bcrypt.hash('VP@2025', 10);
  const presidentHash = await bcrypt.hash('President@2025', 10);
  
  console.log('VP Password Hash:');
  console.log(vpHash);
  console.log('\nPresident Password Hash:');
  console.log(presidentHash);
}

generateHashes();
*/

-- ═══════════════════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════════════════

/*
PASSWORD REQUIREMENTS:
- VP: VP@2025
- President: President@2025

STEPS TO ADD PASSWORDS:
1. Generate bcrypt hashes for both passwords
2. Uncomment the correct OPTION (1, 2, or 3) based on your column name
3. Replace REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_VP with VP hash
4. Replace REPLACE_WITH_ACTUAL_BCRYPT_HASH_FOR_PRESIDENT with President hash
5. Run this SQL file
6. Verify using the verification query

SECURITY NOTES:
- Never store plain text passwords
- Always use bcrypt with at least 10 rounds
- Change these default passwords after first login
- Implement password complexity requirements
*/
