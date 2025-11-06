# 🔍 How to Check and Fix Enum Values

## What Happened

Your `vehicles.type` column uses a PostgreSQL **ENUM** type called `vehicle_type`. This means it only accepts specific predefined values.

The script tried to insert `'suv'` and `'pickup'` but these are **NOT valid values** in your enum!

---

## Step 1: Check What Values Are Valid

Run this query in Supabase to see what values are allowed:

```sql
-- Check valid vehicle_type enum values
SELECT unnest(enum_range(NULL::vehicle_type)) as valid_type;
```

You'll probably see something like:
```
valid_type
----------
van
bus
car
```

---

## Step 2A: Add More Vehicles with Valid Types

Once you know the valid types, you can add more vehicles manually:

```sql
-- Example: If your enum only has 'van', 'bus', 'car'
INSERT INTO public.vehicles (vehicle_name, plate_number, type, capacity, status, notes) VALUES
('Toyota Fortuner', 'CAR-1111', 'car', 7, 'available', 'Executive vehicle'),
('Ford Ranger', 'CAR-2222', 'car', 5, 'available', 'Utility vehicle'),
('Mitsubishi Montero', 'CAR-3333', 'car', 7, 'available', 'Standard vehicle')
ON CONFLICT (plate_number) DO NOTHING;
```

---

## Step 2B: OR Add New Values to the Enum (Advanced)

If you want to add `'suv'` and `'pickup'` to your enum:

```sql
-- Add new values to the vehicle_type enum
ALTER TYPE vehicle_type ADD VALUE IF NOT EXISTS 'suv';
ALTER TYPE vehicle_type ADD VALUE IF NOT EXISTS 'pickup';

-- Now you can insert SUV and pickup vehicles
INSERT INTO public.vehicles (vehicle_name, plate_number, type, capacity, status, notes) VALUES
('Toyota Fortuner', 'CAR-1111', 'suv', 7, 'available', 'Executive SUV'),
('Ford Ranger', 'CAR-2222', 'pickup', 5, 'available', 'Utility pickup'),
('Mitsubishi Montero', 'CAR-3333', 'suv', 7, 'available', 'Standard SUV')
ON CONFLICT (plate_number) DO NOTHING;
```

**⚠️ WARNING:** Adding enum values is **permanent** and can't be easily undone!

---

## What's Currently in the Script

The safe migration script now only adds:

### ✅ 7 Vehicles (Safe Values):
- 5 Vans (L300, Hiace, Adventure, Urvan, Crosswind)
- 2 Buses (School Bus 01, 02)

### ❌ Removed (Invalid Enum):
- Toyota Fortuner ('suv')
- Ford Ranger ('pickup')
- Mitsubishi Montero ('suv')

---

## Recommended Approach

### Option 1: Keep it Simple (Recommended)
Just use the 7 vehicles (vans + buses) that work. You can add more vans or buses if needed:

```sql
INSERT INTO public.vehicles (vehicle_name, plate_number, type, capacity, status) VALUES
('Hyundai H350', 'VAN-1001', 'van', 16, 'available'),
('Toyota Coaster', 'BUS-0003', 'bus', 30, 'available')
ON CONFLICT (plate_number) DO NOTHING;
```

### Option 2: Use 'car' Instead of 'suv'
If 'car' is a valid enum value:

```sql
INSERT INTO public.vehicles (vehicle_name, plate_number, type, capacity, status, notes) VALUES
('Toyota Fortuner', 'CAR-1111', 'car', 7, 'available', 'Executive vehicle'),
('Mitsubishi Montero', 'CAR-3333', 'car', 7, 'available', 'Standard vehicle')
ON CONFLICT (plate_number) DO NOTHING;
```

### Option 3: Add New Enum Values (Advanced)
Follow Step 2B above to add 'suv' and 'pickup' to the enum.

---

## How to Check Your Enum Definition

```sql
-- See the enum type definition
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'vehicle_type'
ORDER BY e.enumsortorder;
```

---

## Summary

1. ✅ **Run this first:** Check valid enum values
   ```sql
   SELECT unnest(enum_range(NULL::vehicle_type));
   ```

2. ✅ **Run the safe script:** `SAFE-MIGRATION-FOR-EXISTING-SCHEMA.sql`
   - This will add 7 vehicles that definitely work

3. ✅ **Optional:** Add more vehicles using valid enum values
   - Either stick with 'van'/'bus'
   - Or use 'car' if available
   - Or add new enum values if needed

---

## Quick Fix

If you just want it to work NOW:

```sql
-- Just run this! Uses only 'van' and 'bus' which should be valid
-- Already in SAFE-MIGRATION-FOR-EXISTING-SCHEMA.sql
```

The script is already fixed and ready to run! 🎉
