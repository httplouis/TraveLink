# 🔍 DATABASE ISSUE - CRITICAL!

## **🚨 PROBLEM CONFIRMED:**

### **Console Shows:**
```
[PATCH /api/head] Updating request with: {
  updateData: {
    status: 'pending_admin',
    head_approved_by: '30a1e6ff-0196-4d99-8879-d012fb7f13a7',  ← Trying to set
    head_approved_at: '...',
    head_signature: '...'
  }
}

[PATCH /api/head] Verification after update: {
  status: 'pending_head',        ← DIDN'T CHANGE! ❌
  head_approved_by: null,        ← STILL NULL! ❌
  parent_head_approved_by: null
}
```

**DIAGNOSIS:** Database update is FAILING silently!

---

## **💥 ROOT CAUSES (One of These):**

### **1. Columns Don't Exist in Database**
```
Code tries to update: head_approved_by
Database: "What column? I'll just ignore it..."
Result: Silent failure
```

### **2. Row Level Security (RLS) Policy Blocking**
```
Supabase RLS: "You can't update this column!"
Result: Update denied, no error shown
```

### **3. Database Trigger Reverting Changes**
```
Trigger: "I'll undo that change!"
Result: Update happens, then immediately reverted
```

---

## **✅ SOLUTION STEPS:**

### **STEP 1: Run This SQL in Supabase**

**Go to:** Supabase Dashboard → SQL Editor → New Query

**Run This:**
```sql
-- Check if columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'requests'
  AND column_name IN (
    'head_approved_at',
    'head_approved_by',
    'head_signature',
    'head_comments',
    'parent_head_approved_at',
    'parent_head_approved_by',
    'parent_head_signature',
    'parent_head_comments'
  )
ORDER BY column_name;
```

**Expected Result:**
```
column_name            | data_type              | is_nullable
-----------------------|------------------------|------------
head_approved_at       | timestamp with time... | YES
head_approved_by       | uuid                   | YES
head_comments          | text                   | YES
head_signature         | text                   | YES
parent_head_approved...| timestamp with time... | YES
parent_head_approved_by| uuid                   | YES
...
```

**If You See 0 Rows:** Columns DON'T EXIST! Go to Step 2.

---

### **STEP 2: Add Missing Columns**

**Run in Supabase SQL Editor:**
```sql
-- Add head approval columns
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS head_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS head_approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS head_signature TEXT,
ADD COLUMN IF NOT EXISTS head_comments TEXT;

-- Add parent head approval columns  
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS parent_head_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_head_approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS parent_head_signature TEXT,
ADD COLUMN IF NOT EXISTS parent_head_comments TEXT;

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_name = 'requests' 
  AND column_name LIKE '%head_approved%';
```

---

### **STEP 3: Check RLS Policies**

**Run in Supabase SQL Editor:**
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'requests';

-- List RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'requests';
```

**If RLS is ON and blocking updates:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;

-- Or add a policy that allows service role to update
CREATE POLICY "Service role can update all columns"
ON public.requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### **STEP 4: Test Direct Update**

**Run in Supabase SQL Editor:**
```sql
-- Get a test request ID
SELECT id, status, head_approved_by 
FROM public.requests 
WHERE status = 'pending_head' 
LIMIT 1;

-- Try to update it (replace with actual IDs)
UPDATE public.requests
SET 
  status = 'pending_admin',
  head_approved_by = '30a1e6ff-0196-4d99-8879-d012fb7f13a7',
  head_approved_at = NOW(),
  head_signature = 'test'
WHERE id = 'fe4704cc-b886-4720-8f7c-8c66ea938d50'
RETURNING id, status, head_approved_by, head_approved_at;
```

**Expected Result:**
```
id         | status        | head_approved_by                      | head_approved_at
-----------|---------------|---------------------------------------|------------------
fe4704...  | pending_admin | 30a1e6ff-0196-4d99-8879-d012fb7f13a7 | 2025-11-05 ...
```

**If This Works:** Problem is in the API code or permissions.
**If This Fails:** Problem is in database constraints or triggers.

---

### **STEP 5: Check for Triggers**

**Run in Supabase SQL Editor:**
```sql
-- Check for triggers on requests table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'requests';
```

**If you see triggers:** One might be reverting changes. Disable temporarily:
```sql
ALTER TABLE public.requests DISABLE TRIGGER ALL;
```

---

## **🔧 QUICK FIX FILE:**

I created: `FIX_APPROVAL_COLUMNS.sql`

**To Run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy contents of `FIX_APPROVAL_COLUMNS.sql`
5. Click "Run"

---

## **📊 DIAGNOSTIC CHECKLIST:**

Run these in order and tell me the results:

### **Test 1: Columns Exist?**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'requests' 
  AND column_name = 'head_approved_by';
```
- [ ] Returns 1 row (column exists)
- [ ] Returns 0 rows (column missing) ← Need to add!

### **Test 2: Can Direct Update Work?**
```sql
UPDATE public.requests
SET head_approved_by = '30a1e6ff-0196-4d99-8879-d012fb7f13a7'
WHERE id = 'fe4704cc-b886-4720-8f7c-8c66ea938d50'
RETURNING head_approved_by;
```
- [ ] Returns the user ID (works!)
- [ ] Error or null (blocked!)

### **Test 3: RLS Enabled?**
```sql
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'requests';
```
- [ ] Returns 'f' (RLS disabled)
- [ ] Returns 't' (RLS enabled) ← Check policies!

---

## **🚨 MOST LIKELY ISSUE:**

**Columns Don't Exist in Database!**

Even though they're in the `.sql` files, if those SQL files weren't run in Supabase, the columns don't exist!

---

## **✅ IMMEDIATE ACTION:**

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run This ONE command:**

```sql
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS head_approved_by UUID REFERENCES public.users(id);
```

4. **Check if it worked:**

```sql
SELECT head_approved_by FROM public.requests LIMIT 1;
```

5. **If you get an error:** Send me the EXACT error message!
6. **If it returns NULL:** Column exists! Try approving again!

---

## **🎯 WHAT TO SEND ME:**

**Run these 3 queries and send results:**

**Query 1:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'requests' 
  AND column_name LIKE '%approved_by%';
```

**Query 2:**
```sql
SELECT COUNT(*) FROM public.requests 
WHERE head_approved_by IS NOT NULL;
```

**Query 3:**
```sql
UPDATE public.requests
SET head_approved_by = '30a1e6ff-0196-4d99-8879-d012fb7f13a7'
WHERE id = (SELECT id FROM public.requests WHERE status = 'pending_head' LIMIT 1)
RETURNING id, head_approved_by;
```

---

**RUN SA SUPABASE SQL EDITOR THEN SEND RESULTS! 🔍**
