# 🧪 Test HR Inbox API

## Found Issue:
Database shows 2 requests with `status = 'pending_hr'` but HR inbox is empty!

## Requests Waiting:
- TO-2025-888 (approved Nov 8, 8:18 PM)
- TO-2025-889 (approved Nov 8, 4:48 PM)

## Test Steps:

### 1. Test API Directly
Open browser and go to:
```
http://localhost:3000/api/hr/inbox
```

**Expected Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "request_number": "TO-2025-888",
      "status": "pending_hr",
      ...
    },
    {
      "id": "...",
      "request_number": "TO-2025-889",
      "status": "pending_hr",
      ...
    }
  ]
}
```

**If you get an error**, that's the problem!

### 2. Check Browser Console
When on HR inbox page:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors related to `/api/hr/inbox`

### 3. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh HR inbox page
4. Look for `/api/hr/inbox` request
5. Check if it returns 200 or 500

---

## If API Returns Empty/Error:

The foreign key hint in the API might still be wrong. 

Check what column name is used in requests table:
- Is it `requester_id`?
- Or `requester_user_id`?

Run this SQL:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
AND column_name LIKE '%requester%';
```
