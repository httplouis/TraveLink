# 📋 All Accounts - Complete Table

## Create these accounts:

| Email | Password | Name |
|-------|----------|------|
| `president@mseuf.edu.ph` | `President2024!` | Naila E. Leveriza |
| `svp.academics@mseuf.edu.ph` | `SVP2024!` | Dr. Benilda Villenas |
| `vp.admin@mseuf.edu.ph` | `VPAdmin2024!` | Atty. Dario R. Opistan |
| `vp.external@mseuf.edu.ph` | `VPExternal2024!` | Celso D. Jaballa |
| `vp.finance@mseuf.edu.ph` | `VPFinance2024!` | Carlito M. Rodriguez |
| `comptroller@mseuf.edu.ph` | `Comptroller2024!` | Carlos Jayron A. Remiendo |
| `audrey.abulencia@mseuf.edu.ph` | `Audrey2024!` | Audrey R. Abulencia |
| `albert.alingalan@mseuf.edu.ph` | `Albert2024!` | Albert D. Alingalan |
| `cleofe.atayde@mseuf.edu.ph` | `Cleofe2024!` | Cleofe A. Atayde |
| `trizzia.casino@mseuf.edu.ph` | `Trizzia2024!` | Trizzia Maree Z. Casiño |

---

## 📊 Account Details

### Executive Level (5 accounts)
| # | Email | Password | Name | Role | Access |
|---|-------|----------|------|------|--------|
| 1 | `president@mseuf.edu.ph` | `President2024!` | Naila E. Leveriza | exec | President |
| 2 | `svp.academics@mseuf.edu.ph` | `SVP2024!` | Dr. Benilda Villenas | exec | SVP |
| 3 | `vp.admin@mseuf.edu.ph` | `VPAdmin2024!` | Atty. Dario R. Opistan | exec | VP |
| 4 | `vp.external@mseuf.edu.ph` | `VPExternal2024!` | Celso D. Jaballa | exec | VP |
| 5 | `vp.finance@mseuf.edu.ph` | `VPFinance2024!` | Carlito M. Rodriguez | exec | VP |

### Comptroller Office (3 accounts)
| # | Email | Password | Name | Role | Access |
|---|-------|----------|------|------|--------|
| 6 | `comptroller@mseuf.edu.ph` | `Comptroller2024!` | Carlos Jayron A. Remiendo | admin | Comptroller |
| 7 | `audrey.abulencia@mseuf.edu.ph` | `Audrey2024!` | Audrey R. Abulencia | staff | Financial Analyst |
| 8 | `albert.alingalan@mseuf.edu.ph` | `Albert2024!` | Albert D. Alingalan | staff | Financial Analyst |

### Treasury Services / Admin (2 accounts)
| # | Email | Password | Name | Role | Access |
|---|-------|----------|------|------|--------|
| 9 | `cleofe.atayde@mseuf.edu.ph` | `Cleofe2024!` | Cleofe A. Atayde | admin | Admin/Head |
| 10 | `trizzia.casino@mseuf.edu.ph` | `Trizzia2024!` | Trizzia Maree Z. Casiño | admin | Admin |

---

## 🎯 Quick Copy-Paste Table

```
Email                                    | Password            | Name
-----------------------------------------|---------------------|--------------------------
president@mseuf.edu.ph                  | President2024!      | Naila E. Leveriza
svp.academics@mseuf.edu.ph               | SVP2024!           | Dr. Benilda Villenas
vp.admin@mseuf.edu.ph                    | VPAdmin2024!       | Atty. Dario R. Opistan
vp.external@mseuf.edu.ph                 | VPExternal2024!    | Celso D. Jaballa
vp.finance@mseuf.edu.ph                  | VPFinance2024!     | Carlito M. Rodriguez
comptroller@mseuf.edu.ph                 | Comptroller2024!   | Carlos Jayron A. Remiendo
audrey.abulencia@mseuf.edu.ph            | Audrey2024!        | Audrey R. Abulencia
albert.alingalan@mseuf.edu.ph           | Albert2024!        | Albert D. Alingalan
cleofe.atayde@mseuf.edu.ph               | Cleofe2024!        | Cleofe A. Atayde
trizzia.casino@mseuf.edu.ph              | Trizzia2024!       | Trizzia Maree Z. Casiño
```

---

## 📝 Notes

- **All VPs and President**: `is_head = TRUE`, `role = 'exec'`
- **Comptroller**: `role = 'admin'`, `is_comptroller = TRUE` (may sariling comptroller view)
- **Financial Analysts** (Audrey & Albert): `role = 'staff'`, `is_comptroller = TRUE` (makakareceive ng requests)
- **Admin accounts** (Cleofe & Trizzia): `role = 'admin'`, `is_admin = TRUE` (admin view access)

---

## 🚀 Steps

1. **Create accounts in Supabase Auth:**
   - Go to: https://supabase.com/dashboard → Authentication → Users → Add User
   - Create each account using the table above
   - ✅ Check "Auto Confirm User"

2. **Run SQL script:**
   - Run `CREATE-ALL-EXEC-ACCOUNTS.sql` in Supabase SQL Editor
   - This will set all roles, departments, and parent relationships

3. **Done!** ✅

