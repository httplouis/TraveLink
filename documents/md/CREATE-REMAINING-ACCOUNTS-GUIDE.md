# ⚠️ Missing Accounts - Action Required

## Current Status

✅ **Created in Supabase Auth:**
- `president@mseuf.edu.ph` ✅
- `comptroller@mseuf.edu.ph` ✅

❌ **Missing from Supabase Auth (Need to Create):**
- `svp.academics@mseuf.edu.ph`
- `vp.admin@mseuf.edu.ph`
- `vp.external@mseuf.edu.ph`
- `vp.finance@mseuf.edu.ph`
- `audrey.abulencia@mseuf.edu.ph`
- `cleofe.atayde@mseuf.edu.ph`
- `trizzia.casino@mseuf.edu.ph`

---

## 🔧 Step 1: Fix Existing Accounts

**Run this SQL first** to fix the 2 existing accounts:

```sql
-- Fix President
UPDATE public.users
SET 
  name = 'Naila E. Leveriza',
  role = 'exec',
  exec_type = 'president',
  is_president = TRUE,
  is_vp = FALSE
WHERE email = 'president@mseuf.edu.ph';

-- Fix Comptroller
UPDATE public.users
SET 
  name = 'Carlos Jayron A. Remiendo',
  role = 'staff',
  exec_type = NULL,
  is_comptroller = TRUE,
  is_vp = FALSE,
  is_president = FALSE
WHERE email = 'comptroller@mseuf.edu.ph';
```

---

## 📧 Step 2: Create Missing Accounts in Supabase Auth

**Go to:** https://supabase.com/dashboard → Authentication → Users → Add User

**Create these 7 accounts:**

| Email | Password | Name |
|-------|----------|------|
| `svp.academics@mseuf.edu.ph` | `SVP2024!` | Dr. Benilda Villenas |
| `vp.admin@mseuf.edu.ph` | `VPAdmin2024!` | Atty. Dario R. Opistan |
| `vp.external@mseuf.edu.ph` | `VPExternal2024!` | Celso D. Jaballa |
| `vp.finance@mseuf.edu.ph` | `VPFinance2024!` | Carlito M. Rodriguez |
| `audrey.abulencia@mseuf.edu.ph` | `Audrey2024!` | Audrey R. Abulencia |
| `cleofe.atayde@mseuf.edu.ph` | `Cleofe2024!` | Cleofe A. Atayde |
| `trizzia.casino@mseuf.edu.ph` | `Trizzia2024!` | Trizzia Maree Z. Casiño |

**For each account:**
1. Click "Add User" → "Create New User"
2. Enter email
3. Enter password
4. ✅ Check "Auto Confirm User"
5. Click "Create User"

---

## 🚀 Step 3: Run SQL Script Again

**After creating all 7 accounts in Auth, run:**

`CREATE-ALL-EXEC-ACCOUNTS.sql`

This will:
- Create the remaining 7 accounts in the `users` table
- Set all roles, departments, and parent relationships
- Complete the hierarchy

---

## ✅ Step 4: Set Parent Relationships

**After all accounts are created, run:**

```sql
-- Set Comptroller's parent to VP Finance
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'vp.finance@mseuf.edu.ph')
WHERE email = 'comptroller@mseuf.edu.ph';

-- Set Financial Analyst's parent to Comptroller
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'comptroller@mseuf.edu.ph')
WHERE email = 'audrey.abulencia@mseuf.edu.ph';

-- Set Director Treasury Services' parent to VP Finance
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'vp.finance@mseuf.edu.ph')
WHERE email = 'cleofe.atayde@mseuf.edu.ph';

-- Set Treasury Staff's parent to Director Treasury Services
UPDATE public.users
SET parent_id = (SELECT id FROM users WHERE email = 'cleofe.atayde@mseuf.edu.ph')
WHERE email = 'trizzia.casino@mseuf.edu.ph';
```

---

## 🎯 Quick Summary

1. ✅ **Fixed:** President and Comptroller accounts (names, roles)
2. ⏳ **Pending:** Create 7 missing accounts in Supabase Auth
3. ⏳ **Pending:** Run `CREATE-ALL-EXEC-ACCOUNTS.sql` again
4. ⏳ **Pending:** Set parent relationships

**After completing all steps, you'll have all 9 accounts with correct hierarchy!** 🎉

