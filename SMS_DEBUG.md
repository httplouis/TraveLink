# 🔍 SMS NOT SENDING - DEBUG GUIDE

## 📋 **SMS Sending Conditions (President Approval)**

SMS is sent when President approves **ONLY IF** all these conditions are met:

1. ✅ Request status becomes `"approved"` (fully approved, not routed to another approver)
2. ✅ `request.assigned_driver_id` exists (driver is assigned)
3. ✅ `!request.sms_notification_sent` (SMS hasn't been sent yet)
4. ✅ Driver has `phone_number` in database
5. ✅ Twilio credentials are configured (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)

## 🚨 **COMMON ISSUES:**

### **Issue 1: Driver Not Assigned**
- **Symptom:** No SMS sent
- **Check:** Does the request have `assigned_driver_id`?
- **Fix:** Assign driver first before President approves, OR assign driver after approval

### **Issue 2: SMS Already Sent**
- **Symptom:** No SMS sent (flag already true)
- **Check:** Is `sms_notification_sent = true` in database?
- **Fix:** Reset flag if needed, or SMS was already sent earlier

### **Issue 3: Driver Has No Phone Number**
- **Symptom:** Warning in console: "Driver has no phone number"
- **Check:** Does driver have `phone_number` in `users` table?
- **Fix:** Add phone number to driver's profile

### **Issue 4: Twilio Not Configured**
- **Symptom:** Error: "Twilio credentials not configured"
- **Check:** Are environment variables set?
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
- **Fix:** Add to `.env.local` and Vercel environment variables

### **Issue 5: Request Not Fully Approved**
- **Symptom:** SMS not sent because request routed to another approver
- **Check:** Is `newStatus === "approved"`?
- **Fix:** Ensure President selects "Final Approval" (no next approver)

### **Issue 6: Phone Number Format**
- **Symptom:** Invalid phone number error
- **Check:** Is phone number in correct format?
- **Expected:** `+639123456789` or `09123456789`
- **Fix:** Normalize phone number in database

## 🔍 **DEBUG STEPS:**

### **Step 1: Check Console Logs**
Look for these messages:
- `[President Approve] ✅ SMS sent to driver...` - SMS sent successfully
- `[President Approve] ❌ Failed to send SMS...` - SMS failed
- `[President Approve] ⚠️ Driver has no phone number...` - Missing phone
- `[sendSMS] Twilio credentials not configured...` - Missing Twilio config

### **Step 2: Check Database**
```sql
-- Check if driver is assigned
SELECT id, assigned_driver_id, sms_notification_sent, sms_sent_at 
FROM requests 
WHERE id = '<request_id>';

-- Check driver phone number
SELECT id, name, phone_number 
FROM users 
WHERE id = '<driver_id>';
```

### **Step 3: Check Environment Variables**
```bash
# In Vercel dashboard or .env.local
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### **Step 4: Check Request Status**
```sql
-- Check if request is fully approved
SELECT id, status, assigned_driver_id, sms_notification_sent
FROM requests 
WHERE id = '<request_id>';
```

## ✅ **QUICK FIXES:**

### **Fix 1: Assign Driver Before Approval**
1. Admin assigns driver in schedule page
2. President approves request
3. SMS should send automatically

### **Fix 2: Assign Driver After Approval**
1. President approves request (no driver yet)
2. Admin assigns driver later
3. SMS sends when driver is assigned (if request is already approved)

### **Fix 3: Add Driver Phone Number**
```sql
UPDATE users 
SET phone_number = '+639935583858' 
WHERE id = '<driver_id>';
```

### **Fix 4: Reset SMS Flag (if needed)**
```sql
UPDATE requests 
SET sms_notification_sent = false, sms_sent_at = NULL 
WHERE id = '<request_id>';
```

## 📝 **CURRENT FLOW:**

1. **President Approves** → `/api/president/action` (POST)
2. **Check Conditions:**
   - `newStatus === "approved"` ✅
   - `request.assigned_driver_id` exists ✅
   - `!request.sms_notification_sent` ✅
3. **Fetch Driver:**
   - Get driver from `users` table
   - Check `driver.phone_number` exists
4. **Send SMS:**
   - Call `sendDriverTravelNotification()`
   - Update `sms_notification_sent = true`
   - Update `sms_sent_at = now()`

## 🚨 **IF STILL NOT WORKING:**

1. Check browser console for errors
2. Check server logs (Vercel logs)
3. Check Twilio dashboard for message logs
4. Verify phone number format
5. Test SMS manually using Twilio API

