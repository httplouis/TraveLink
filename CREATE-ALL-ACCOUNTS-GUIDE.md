# 📋 Complete Account Creation Guide

## 🎯 Accounts to Create

### Executive Level (5 accounts)
1. **President/COO**: Naila E. Leveriza
2. **SVP for Academics**: Dr. Benilda Villenas
3. **VP for Administration**: Atty. Dario R. Opistan
4. **VP for External Relations**: Celso D. Jaballa
5. **VP for Finance**: Carlito M. Rodriguez

### Comptroller Office (3 accounts)
6. **Comptroller**: Carlos Jayron A. Remiendo
7. **Financial Analyst**: Audrey R. Abulencia
8. **Financial Analyst**: Albert D. Alingalan (kapantay ni Audrey)

### Treasury Services / Admin (2 accounts)
9. **Director, Treasury Services**: Cleofe A. Atayde (Head + Admin)
10. **Treasury Staff / Coordinator**: Trizzia Maree Z. Casiño (Admin)

---

## 📧 Email Addresses & Passwords

### Option 1: Create via API (Automated)

**I've created an API endpoint for you!**

**Call this endpoint:**
```bash
POST /api/admin/create-exec-accounts
```

**How to use:**
1. Make sure you're logged in as super-admin
2. Open browser console or use Postman/curl
3. Call the endpoint:
   ```javascript
   fetch('/api/admin/create-exec-accounts', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.json())
   .then(console.log);
   ```

**Or use curl:**
```bash
curl -X POST http://localhost:3000/api/admin/create-exec-accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]"
```

**After API creates accounts, run the SQL script** (Step 2 below)

### Option 2: Create Manually in Supabase Auth (Recommended for First Time)

**Go to:** https://supabase.com/dashboard → Authentication → Users → Add User

**Create these accounts:**

| # | Email | Password | Name | Role |
|---|-------|----------|------|------|
| 1 | `president@mseuf.edu.ph` | `President2024!` | Naila E. Leveriza | President |
| 2 | `svp.academics@mseuf.edu.ph` | `SVP2024!` | Dr. Benilda Villenas | SVP |
| 3 | `vp.admin@mseuf.edu.ph` | `VPAdmin2024!` | Atty. Dario R. Opistan | VP |
| 4 | `vp.external@mseuf.edu.ph` | `VPExternal2024!` | Celso D. Jaballa | VP |
| 5 | `vp.finance@mseuf.edu.ph` | `VPFinance2024!` | Carlito M. Rodriguez | VP |
| 6 | `comptroller@mseuf.edu.ph` | `Comptroller2024!` | Carlos Jayron A. Remiendo | Comptroller |
| 7 | `audrey.abulencia@mseuf.edu.ph` | `Audrey2024!` | Audrey R. Abulencia | Staff |
| 8 | `albert.alingalan@mseuf.edu.ph` | `Albert2024!` | Albert D. Alingalan | Staff |
| 9 | `cleofe.atayde@mseuf.edu.ph` | `Cleofe2024!` | Cleofe A. Atayde | Admin/Head |
| 10 | `trizzia.casino@mseuf.edu.ph` | `Trizzia2024!` | Trizzia Maree Z. Casiño | Admin |

---

## 📊 Hierarchy Structure

```
President/COO (Naila E. Leveriza)
│
├── SVP for Academics (Dr. Benilda Villenas)
├── VP for Administration (Atty. Dario R. Opistan)
├── VP for External Relations (Celso D. Jaballa)
└── VP for Finance (Carlito M. Rodriguez)
    │
    ├── Comptroller (Carlos Jayron A. Remiendo)
    │   ├── Financial Analyst (Audrey R. Abulencia)
    │   └── Financial Analyst (Albert D. Alingalan)
    │
    └── Director, Treasury Services (Cleofe A. Atayde) [Head + Admin]
        └── Treasury Staff / Coordinator (Trizzia Maree Z. Casiño) [Admin]
```

---

## 🚀 Step-by-Step Instructions

### Step 1: Create Accounts in Supabase Auth

**Choose one method:**

**Option A: I Create via API** (Tell me to proceed)
- I'll create all 9 accounts automatically
- You'll receive confirmation

**Option B: You Create Manually**
1. Go to: https://supabase.com/dashboard
2. Navigate to: **Authentication** → **Users**
3. Click: **Add User** (or **Invite User**)
4. For each account:
   - Enter email
   - Enter password (from table above)
   - Check "Auto Confirm User" ✅
   - Click "Create User"

### Step 2: Run SQL Script

After creating accounts in Auth, run this SQL script:

**File:** `CREATE-ALL-EXEC-ACCOUNTS.sql`

**How to run:**
1. Go to: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Click: **New Query**
4. Copy contents of `CREATE-ALL-EXEC-ACCOUNTS.sql`
5. Paste into SQL Editor
6. Click: **Run** (or press `Ctrl+Enter`)

### Step 3: Verify Accounts

After running SQL, run this verification query:

```sql
SELECT 
  u.email,
  u.name,
  u.position_title,
  u.role,
  u.is_president,
  u.is_vp,
  u.is_comptroller,
  u.is_head,
  u.is_admin,
  d.name as department_name,
  parent.name as parent_name
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN users parent ON u.parent_id = parent.id
WHERE u.email IN (
  'president@mseuf.edu.ph',
  'svp.academics@mseuf.edu.ph',
  'vp.admin@mseuf.edu.ph',
  'vp.external@mseuf.edu.ph',
  'vp.finance@mseuf.edu.ph',
  'comptroller@mseuf.edu.ph',
  'audrey.abulencia@mseuf.edu.ph',
  'cleofe.atayde@mseuf.edu.ph',
  'trizzia.casino@mseuf.edu.ph'
)
ORDER BY 
  CASE 
    WHEN u.is_president = TRUE THEN 1
    WHEN u.is_vp = TRUE THEN 2
    WHEN u.is_comptroller = TRUE THEN 3
    WHEN u.is_head = TRUE THEN 4
    WHEN u.is_admin = TRUE THEN 5
    ELSE 6
  END;
```

---

## ✅ Expected Results

After running the SQL script, you should see:

1. **President**: `is_president = TRUE`, `exec_type = 'president'`
2. **SVP**: `is_vp = TRUE`, `exec_type = 'svp_academics'`
3. **VPs**: `is_vp = TRUE`, `exec_type = 'vp_admin'/'vp_external'/'vp_finance'`
4. **Comptroller**: `is_comptroller = TRUE`
5. **Cleofe**: `is_head = TRUE`, `is_admin = TRUE`, `role = 'admin'`
6. **Trizzia**: `is_admin = TRUE`, `role = 'admin'`
7. **Parent relationships** set correctly

---

## 🔐 Password Security

**Default passwords are:**
- Format: `[Name/Role]2024!`
- Example: `President2024!`, `VPAdmin2024!`

**After first login, users should:**
1. Change password immediately
2. Enable 2FA (if available)

---

## 🎯 Access Levels

### Admin View Access:
- ✅ Cleofe A. Atayde (Director, Treasury Services)
- ✅ Trizzia Maree Z. Casiño (Treasury Staff / Coordinator)

### Comptroller Access:
- ✅ Carlos Jayron A. Remiendo (Comptroller)

### Executive Access:
- ✅ All VPs and President

---

## 📝 Notes

1. **HR Account**: You mentioned HR but didn't provide names. If you want to add HR accounts later, just let me know!

2. **Parent Relationships**: The SQL script automatically sets:
   - Comptroller → VP Finance
   - Financial Analyst → Comptroller
   - Director Treasury → VP Finance
   - Treasury Staff → Director Treasury

3. **Department Assignment**: All accounts are assigned to their respective departments automatically.

4. **Testing**: After creating accounts, test login for each role to verify access.

---

## 🆘 Troubleshooting

### "User not found" error
- Make sure you created the account in Supabase Auth first
- Check email spelling matches exactly

### "Department not found" error
- Run the department insertion script first (if not already done)
- Check department IDs in the SQL script

### "Parent not found" error
- Make sure parent accounts are created first
- Check parent email matches exactly

---

## 🚀 Ready to Go!

**Tell me:**
- "Create accounts via API" → I'll create all 9 accounts automatically
- "I'll create manually" → Follow the guide above

Then run the SQL script and you're done! 🎉

