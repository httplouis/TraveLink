# 📋 Accounts Quick Reference

## 🎯 All 10 Accounts - Emails & Passwords

| # | Email | Password | Name | Role | Access |
|---|-------|----------|------|------|--------|
| 1 | `president@mseuf.edu.ph` | `President2024!` | Naila E. Leveriza | President | Executive |
| 2 | `svp.academics@mseuf.edu.ph` | `SVP2024!` | Dr. Benilda Villenas | SVP | Executive |
| 3 | `vp.admin@mseuf.edu.ph` | `VPAdmin2024!` | Atty. Dario R. Opistan | VP | Executive |
| 4 | `vp.external@mseuf.edu.ph` | `VPExternal2024!` | Celso D. Jaballa | VP | Executive |
| 5 | `vp.finance@mseuf.edu.ph` | `VPFinance2024!` | Carlito M. Rodriguez | VP | Executive |
| 6 | `comptroller@mseuf.edu.ph` | `Comptroller2024!` | Carlos Jayron A. Remiendo | Comptroller | Comptroller |
| 7 | `audrey.abulencia@mseuf.edu.ph` | `Audrey2024!` | Audrey R. Abulencia | Staff | Financial Analyst |
| 8 | `albert.alingalan@mseuf.edu.ph` | `Albert2024!` | Albert D. Alingalan | Staff | Financial Analyst |
| 9 | `cleofe.atayde@mseuf.edu.ph` | `Cleofe2024!` | Cleofe A. Atayde | Admin/Head | Admin View |
| 10 | `trizzia.casino@mseuf.edu.ph` | `Trizzia2024!` | Trizzia Maree Z. Casiño | Admin | Admin View |

---

## 🚀 Quick Setup (2 Steps)

### Step 1: Create Accounts in Supabase Auth

**Option A: Via API** (Automated)
```bash
# Call this endpoint (must be logged in as super-admin)
POST /api/admin/create-exec-accounts
```

**Option B: Manual** (Supabase Dashboard)
1. Go to: https://supabase.com/dashboard
2. Authentication → Users → Add User
3. Create each account using the table above
4. ✅ Check "Auto Confirm User"

### Step 2: Run SQL Script

1. Go to: Supabase Dashboard → SQL Editor
2. Open: `CREATE-ALL-EXEC-ACCOUNTS.sql`
3. Click: **Run**

**Done!** ✅

---

## 📊 Hierarchy

```
President (Naila)
├── SVP Academics (Benilda)
├── VP Admin (Dario)
├── VP External (Celso)
└── VP Finance (Carlito)
    ├── Comptroller (Carlos)
    │   ├── Financial Analyst (Audrey)
    │   └── Financial Analyst (Albert)
    └── Director Treasury (Cleofe) [Admin]
        └── Treasury Staff (Trizzia) [Admin]
```

---

## ✅ Verification

After setup, run this query to verify:

```sql
SELECT 
  email,
  name,
  position_title,
  is_president,
  is_vp,
  is_comptroller,
  is_admin,
  is_head
FROM users
WHERE email IN (
  'president@mseuf.edu.ph',
  'svp.academics@mseuf.edu.ph',
  'vp.admin@mseuf.edu.ph',
  'vp.external@mseuf.edu.ph',
  'vp.finance@mseuf.edu.ph',
  'comptroller@mseuf.edu.ph',
  'audrey.abulencia@mseuf.edu.ph',
  'albert.alingalan@mseuf.edu.ph',
  'cleofe.atayde@mseuf.edu.ph',
  'trizzia.casino@mseuf.edu.ph'
);
```

---

## 🔐 Security Note

**Default passwords are temporary!**
- Users should change password on first login
- Consider enabling 2FA for executives

---

## 📝 Files Created

1. ✅ `CREATE-ALL-EXEC-ACCOUNTS.sql` - SQL script to set roles/departments
2. ✅ `src/app/api/admin/create-exec-accounts/route.ts` - API endpoint to create accounts
3. ✅ `CREATE-ALL-ACCOUNTS-GUIDE.md` - Complete detailed guide
4. ✅ `ACCOUNTS-QUICK-REFERENCE.md` - This file (quick reference)

---

## 🆘 Need Help?

- Check `CREATE-ALL-ACCOUNTS-GUIDE.md` for detailed instructions
- Verify accounts exist in Supabase Auth first
- Make sure SQL script runs without errors
- Check parent relationships are set correctly

