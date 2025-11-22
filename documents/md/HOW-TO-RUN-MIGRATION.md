# 🚀 How to Run the Safe Migration

## ✅ FIXED! No More Errors

Naka-fix ko na yung script. Yung `\echo` commands ay hindi gumagana sa Supabase SQL Editor.

---

## 📋 Step-by-Step Guide

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click **SQL Editor** sa left sidebar
3. Click **New Query**

### Step 2: Copy the ENTIRE SQL Script

1. Open file: **`SAFE-MIGRATION-FOR-EXISTING-SCHEMA.sql`**
2. Select ALL (Ctrl+A)
3. Copy (Ctrl+C)

### Step 3: Paste and Run

1. Paste sa Supabase SQL Editor (Ctrl+V)
2. Click **"Run"** button (or press F5)
3. Wait for it to complete

### Step 4: Verify Results

Scroll down sa results. Dapat makita mo:

```
| table_name          | count |
|---------------------|-------|
| Vehicles            | 10    |
| Drivers (users)     | 5     |
| Drivers (profiles)  | 5     |
```

---

## ✅ Expected Results

### What Gets Added:

**10 Vehicles:**
- L300 Van (ABC-1234)
- Toyota Hiace (DEF-5678)
- Mitsubishi Adventure (GHI-9012)
- Nissan Urvan (JKL-3456)
- Isuzu Crosswind (MNO-7890)
- School Bus 01 (BUS-0001)
- School Bus 02 (BUS-0002)
- Toyota Fortuner (CAR-1111)
- Ford Ranger (CAR-2222)
- Mitsubishi Montero (CAR-3333)

**5 Drivers:**
- Juan Dela Cruz (driver.juan@mseuf.edu.ph)
- Maria Santos (driver.maria@mseuf.edu.ph)
- Pedro Reyes (driver.pedro@mseuf.edu.ph)
- Ana Garcia (driver.ana@mseuf.edu.ph)
- Roberto Fernandez (driver.roberto@mseuf.edu.ph)

---

## 🧪 Test After Running

### Test 1: Check Database

Run this query in Supabase:

```sql
-- Check vehicles
SELECT vehicle_name, plate_number, type FROM vehicles;

-- Check drivers
SELECT u.name, u.email, d.license_no 
FROM drivers d 
JOIN users u ON d.user_id = u.id;
```

### Test 2: Test API Endpoints

Open in browser:

```
http://localhost:3000/api/vehicles
http://localhost:3000/api/drivers
```

Dapat may JSON response with data.

### Test 3: Test UI

1. Go to: `http://localhost:3000/user/request`
2. Select **"Institutional"** vehicle mode
3. Check if dropdowns populate with data from database

---

## ❌ If You Get Errors

### Error: "duplicate key value violates unique constraint"

**Meaning:** Data already exists!  
**Solution:** That's OK! Script uses `ON CONFLICT DO NOTHING` so it won't duplicate.

### Error: "relation does not exist"

**Meaning:** Table doesn't exist  
**Solution:** Check if you have `vehicles`, `users`, and `drivers` tables. Run your main schema setup first.

### Error: "column does not exist"

**Meaning:** Column name mismatch  
**Solution:** Check your actual schema. The script uses:
- `vehicle_name` (not `name`)
- `plate_number`
- `license_no` (not `license_number`)

---

## 📝 Summary

1. ✅ Open Supabase SQL Editor
2. ✅ Copy ENTIRE contents of `SAFE-MIGRATION-FOR-EXISTING-SCHEMA.sql`
3. ✅ Paste and Run
4. ✅ Verify counts (10 vehicles, 5 drivers)
5. ✅ Test APIs and UI

**WALANG `\echo` errors na!** 🎉

---

## 🆘 Still Have Issues?

Check:
- Browser console for errors
- Supabase logs for database errors
- Network tab to see if API calls are working

Lahat ng `\echo` commands ay na-convert na to regular comments (`--`), so safe na i-run sa Supabase!
