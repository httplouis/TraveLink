# Office Hierarchy System

## Example: WCDEO → CCMS

**Structure:**
- WCDEO (Office) → Head: Sir Joro → Parent: CCMS
- CCMS (College) → Head: Dean Rodrigo Belleza Jr. → Parent: None

**Approval Flow:**
```
Faculty (WCDEO) submits request
  ↓
Sir Joro (WCDEO Head) approves ← status: pending_head
  ↓
Dean Rodrigo (CCMS Head) approves ← status: pending_parent_head (NEW!)
  ↓
Admin → Comptroller → HR → Exec
```

## Files to Run

### SQL (Run in Supabase):
1. `ADD-REQUESTER-NAME-COLUMN.sql` ← Fix column error
2. `FIX-REQUEST-NUMBER-RACE-CONDITION.sql` ← Fix duplicates
3. `ADD-PARENT-HEAD-SUPPORT.sql` ← Add office hierarchy

### After SQL:
```bash
# Restart dev server
pnpm dev
```

## What Changed

1. **New Status:** `pending_parent_head` - for parent department head approval
2. **New DB Columns:** 
   - departments.parent_department_id
   - requests.parent_department_id
   - requests.parent_head_approved_*
3. **Workflow:** Checks if department has parent → routes accordingly

## Setting Parent Relationships

```sql
-- Set WCDEO under CCMS
UPDATE departments 
SET parent_department_id = (SELECT id FROM departments WHERE code = 'CCMS')
WHERE code = 'WCDEO';

-- Add more as you confirm them!
```

## Testing

1. Run all 3 SQL files
2. Restart dev server
3. Login as faculty.cnahs@mseuf.edu.ph
4. Submit request
5. Should route to office head first, then parent head!
