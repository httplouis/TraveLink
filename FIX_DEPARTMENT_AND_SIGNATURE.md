# ✅ FIXES: DEPARTMENT ROUTING & SIGNATURE COLUMN

## **🎯 2 CRITICAL ISSUES FIXED:**

### **1. ✅ Department Name Mismatch**

**ERROR:**
```
[/api/requests/submit] Form selected dept: College of Criminal Justice and Criminology (CCJC)
[/api/requests/submit] ⚠️ Could not find department: College of Criminal Justice and Criminology (CCJC)
```

**ROOT CAUSE:**
Form sends: `"College of Criminal Justice and Criminology (CCJC)"`  
Database has: `"CCJC"` or different format

**FIX:**
Implemented **3-strategy department lookup**:

**Strategy 1: Exact Match**
```typescript
.eq("name", travelOrder.department)
```

**Strategy 2: Code Extraction**
```typescript
// Extract "CCJC" from "Name (CCJC)"
const codeMatch = travelOrder.department.match(/\(([^)]+)\)$/);
.eq("code", code)  // Search by code
```

**Strategy 3: ILIKE Search**
```typescript
// Remove "(CODE)" and do partial match
const searchName = travelOrder.department.replace(/\s*\([^)]*\)\s*$/, '');
.ilike("name", `%${searchName}%`)  // Case-insensitive search
```

**RESULT:**
- ✅ Handles "CCJC" format
- ✅ Handles "College of Criminal Justice and Criminology" format
- ✅ Handles "College of Criminal Justice and Criminology (CCJC)" format
- ✅ Falls back to requester's department if not found

**FILE:** `src/app/api/requests/submit/route.ts`

---

### **2. ✅ Missing Database Column**

**ERROR:**
```
code: 'PGRST204'
message: "Could not find the 'requester_signature' column of 'requests' in the schema cache"
```

**ROOT CAUSE:**
Code tries to insert `requester_signature` but column doesn't exist in database!

**FIX - TEMPORARY:**
Commented out the field temporarily:
```typescript
// requester_signature: travelOrder.requesterSignature || null,  // TODO: Add column first
```

**FIX - PERMANENT:**
Run the SQL migration to add the column!

---

## **📋 ACTION REQUIRED - RUN SQL MIGRATION:**

### **Step 1: Open Supabase Dashboard**
1. Go to https://supabase.com
2. Select your project
3. Click **SQL Editor** in left sidebar

### **Step 2: Run Migration**
Copy and paste this SQL:

```sql
-- Add requester_signature column
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS requester_signature TEXT;

-- Add comment
COMMENT ON COLUMN requests.requester_signature IS 'Base64 data URL of requester signature';
```

### **Step 3: Verify Column**
Run this to check:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name = 'requester_signature';
```

Should show:
```
column_name          | data_type | is_nullable
---------------------|-----------|------------
requester_signature  | text      | YES
```

### **Step 4: Uncomment Code**
After running SQL, edit `src/app/api/requests/submit/route.ts` line 198:

**Change FROM:**
```typescript
// requester_signature: travelOrder.requesterSignature || null,  // TODO: Add column first
```

**Change TO:**
```typescript
requester_signature: travelOrder.requesterSignature || null,
```

### **Step 5: Test**
1. Submit a new request with signature
2. Check console - should show:
   ```
   [/api/requests/submit] ✅ Using selected department: CCJC (ccjc-id-here)
   ```
3. Verify in database:
   ```sql
   SELECT id, requester_name, department_id, requester_signature 
   FROM requests 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

---

## **🧪 TESTING GUIDE:**

### **Test Department Routing:**

**Test 1: CCJC User Submits Request**
```
Expected console logs:
[/api/requests/submit] Initial dept: College of Nursing... (cnahs-id)
[/api/requests/submit] Form selected dept: College of Criminal Justice and Criminology (CCJC)
[/api/requests/submit] Trying to find by code: CCJC
[/api/requests/submit] ✅ Using selected department: CCJC (CCJC) (ccjc-dept-id)

Result:
✅ Request saved with CCJC department_id
✅ CCJC head sees it in inbox
✅ CNAHS head does NOT see it
```

**Test 2: Check Database**
```sql
-- Get recent request
SELECT 
  r.id,
  r.request_number,
  r.requester_name,
  r.department_id,
  d.name as department_name,
  d.code as department_code,
  r.status
FROM requests r
JOIN departments d ON r.department_id = d.id
ORDER BY r.created_at DESC
LIMIT 1;

-- Should show:
-- department_id matches CCJC's ID
-- department_name shows CCJC
```

**Test 3: Check Head Inbox**
```
1. Login as CCJC head
   → Should see request in inbox ✅

2. Login as CNAHS head
   → Should NOT see CCJC request ✅
```

---

### **Test Signature Display:**

**After running SQL migration:**

**Test 1: Submit with Signature**
```
1. Fill out request form
2. Draw signature in signature pad
3. Submit
4. Check console - no PGRST204 error ✅
5. Check database:
   SELECT requester_signature FROM requests ORDER BY created_at DESC LIMIT 1;
   → Should show base64 data URL starting with "data:image/png;base64," ✅
```

**Test 2: Head Views Request**
```
1. Head opens request in modal
2. Requester signature displays in amber box ✅
3. Shows "Signed by: [Name]" ✅
4. No "No signature provided" message ✅
```

---

## **🔍 DEBUGGING:**

### **If Department Still Wrong:**

**Check Console Logs:**
```
[/api/requests/submit] Initial dept: ...
[/api/requests/submit] Form selected dept: ...
[/api/requests/submit] Trying to find by code: CCJC
[/api/requests/submit] ✅ Using selected department: ...
```

**Check Department Table:**
```sql
-- View all departments
SELECT id, code, name, parent_department_id 
FROM departments 
ORDER BY name;

-- Check specific department
SELECT * FROM departments WHERE code = 'CCJC';
SELECT * FROM departments WHERE name ILIKE '%Criminal Justice%';
```

**Check Request Data:**
```sql
-- Check what was saved
SELECT 
  r.*,
  d.code as dept_code,
  d.name as dept_name
FROM requests r
LEFT JOIN departments d ON r.department_id = d.id
WHERE r.id = 'your-request-id';
```

---

### **If Signature Still Not Working:**

**Check Column Exists:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name = 'requester_signature';
```

**Check Code:**
```typescript
// Make sure line is uncommented in route.ts
requester_signature: travelOrder.requesterSignature || null,
```

**Check Data Flow:**
```typescript
// In RequestWizard.client.tsx
console.log("Submitting signature:", data.travelOrder.requesterSignature?.substring(0, 50));

// In API route
console.log("Received signature:", travelOrder.requesterSignature?.substring(0, 50));
```

---

## **📁 FILES MODIFIED (1):**

### **`src/app/api/requests/submit/route.ts`**

**Changes:**
1. **Department Lookup** (lines 92-153)
   - Added 3-strategy department search
   - Handles different name formats
   - Extracts codes from "(CODE)" format
   - Uses ILIKE for fuzzy matching
   - Falls back to requester's department

2. **Signature Field** (line 198)
   - Commented out temporarily
   - Requires SQL migration first
   - Add back after column exists

---

## **✅ CHECKLIST:**

### **Before Testing:**
- [ ] Code changes deployed
- [ ] SQL migration run in Supabase
- [ ] Verified column exists (run SELECT query)
- [ ] Uncommented signature line (after migration)
- [ ] Server restarted

### **Testing:**
- [ ] Submit request selecting different department
- [ ] Check console logs show correct department
- [ ] Check database department_id is correct
- [ ] Correct head sees request in inbox
- [ ] Other heads don't see it
- [ ] Signature saves to database
- [ ] Signature displays in head modal

---

## **🎯 EXPECTED RESULTS:**

**Department Routing:**
```
✅ Form: "College of Criminal Justice and Criminology (CCJC)"
✅ Logs: "Trying to find by code: CCJC"
✅ Logs: "✅ Using selected department: CCJC (CCJC) (dept-id)"
✅ Database: department_id = CCJC's ID
✅ CCJC head sees request
✅ Other heads don't see it
```

**Signature:**
```
✅ Column exists in database
✅ Signature saves as TEXT (base64 data URL)
✅ Head modal displays signature
✅ Shows in amber gradient box
✅ Shows "Signed by: [Name]"
```

---

## **🚀 STATUS:**

**Department Routing:**
- ✅ Code fixed - 3-strategy lookup
- ✅ Ready to test

**Signature:**
- ⚠️ **SQL MIGRATION REQUIRED**
- ⚠️ **Run ADD_REQUESTER_SIGNATURE_COLUMN.sql**
- ⚠️ **Then uncomment line 198**
- ✅ Code ready after migration

**Test and verify both fixes working!** 🎉
