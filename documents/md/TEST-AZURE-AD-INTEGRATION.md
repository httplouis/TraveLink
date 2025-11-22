# 🧪 How to Test Azure AD Integration

## Quick Test Steps

### Option 1: Test via Registration Page (Easiest) ✅

1. **Start your dev server** (if not running):
   ```bash
   pnpm dev
   ```

2. **Open registration page:**
   - Go to: `http://localhost:3000/register`
   - Or click "Register" sa login page

3. **Enter an institutional email:**
   - Type any email ending with `@mseuf.edu.ph` or `@student.mseuf.edu.ph`
   - Example: `test@mseuf.edu.ph` or `faculty.cnahs@mseuf.edu.ph`
   - **Blur the field** (click outside or press Tab)

4. **Check what happens:**
   - ✅ **If working:** Name and department auto-fill from Azure AD
   - ❌ **If not working:** Email not found message (will use fallback)

5. **Check terminal logs:**
   - Look for `[email-directory]` logs
   - ✅ Success: `[email-directory] ✅ User found in Azure AD`
   - ❌ Error: `[email-directory] ❌ Failed` or `403 Forbidden`

---

### Option 2: Test via Participant Confirmation

1. **Create a seminar request** with participant invitation
2. **Send invitation** to an email (e.g., `test@mseuf.edu.ph`)
3. **Click the confirmation link** from email
4. **Check if name and department auto-fill**
5. **Check terminal logs** for `[email-directory]` messages

---

### Option 3: Direct API Test (Most Detailed) 🔍

**Using Browser:**
1. Open browser
2. Go to: `http://localhost:3000/api/email-directory?email=YOUR_EMAIL@mseuf.edu.ph`
   - Replace `YOUR_EMAIL@mseuf.edu.ph` with actual email
   - Example: `http://localhost:3000/api/email-directory?email=faculty.cnahs@mseuf.edu.ph`

3. **Check the response:**
   - ✅ **If working:** JSON with `"source": "azure_ad"` and user data
   - ❌ **If not working:** Error message or `"source": "simulated_directory"`

**Using Terminal (PowerShell):**
```powershell
# Test with a real email
Invoke-WebRequest -Uri "http://localhost:3000/api/email-directory?email=faculty.cnahs@mseuf.edu.ph" | Select-Object -ExpandProperty Content
```

**Using curl (if installed):**
```bash
curl "http://localhost:3000/api/email-directory?email=faculty.cnahs@mseuf.edu.ph"
```

---

## 📊 What to Look For

### ✅ Success Indicators:

**In Terminal:**
```
[email-directory] ✅ Azure AD credentials found, attempting lookup...
[email-directory] 🔐 Requesting token from: https://login.microsoftonline.com/...
[email-directory] ✅ Azure AD token acquired successfully
[email-directory] 🔍 Querying Graph API: ...
[email-directory] ✅ User found in Azure AD: faculty.cnahs@mseuf.edu.ph
[email-directory] Raw user data: { displayName: "...", department: "...", ... }
[email-directory] ✅ Transformed data: { name: "...", department: "...", position: "..." }
```

**In Browser/Response:**
```json
{
  "ok": true,
  "data": {
    "email": "faculty.cnahs@mseuf.edu.ph",
    "name": "Prof. Juan Dela Cruz",
    "department": "College of Nursing",
    "position": "Faculty"
  },
  "source": "azure_ad",
  "note": "Data retrieved from Azure Active Directory"
}
```

**In Registration Page:**
- Name and department fields auto-fill
- Message shows: "✓ Email verified from directory"

---

### ❌ Error Indicators:

**403 Forbidden (Permission Issue):**
```
[email-directory] ⚠️ Graph API request failed for: ...
[email-directory] Graph API status: 403
[email-directory] 💡 403 Forbidden - Permission issue
[email-directory] ⚠️ You need 'User.Read.All' Application permission
```

**Solution:** Add `User.Read.All` Application permission in Azure Portal

---

**401 Unauthorized (Wrong Credentials):**
```
[email-directory] ❌ Failed to get Azure AD token
[email-directory] Status: 401
[email-directory] 💡 Check: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID are correct
```

**Solution:** Check `.env.local` file - credentials might be wrong

---

**404 Not Found (User doesn't exist):**
```
[email-directory] ℹ️ User not found in Azure AD: test@mseuf.edu.ph
```

**This is OK!** - User doesn't exist in Azure AD, will use fallback

---

**No Azure AD configured:**
```
[email-directory] ❌ Azure AD not configured, using fallback directory
[email-directory] Missing variables: { clientId: true, tenantId: true, clientSecret: true }
```

**Solution:** Add Azure credentials to `.env.local`

---

## 🔍 Detailed Testing Checklist

### Step 1: Check Environment Variables
```bash
# Make sure .env.local has:
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Step 2: Restart Dev Server
```bash
# Stop server (Ctrl+C)
# Then restart:
pnpm dev
```

### Step 3: Test with Real Email
- Use an email that exists in your Azure AD
- Try registration page or direct API call
- Check terminal logs

### Step 4: Check Terminal Logs
- Look for `[email-directory]` messages
- Copy any error messages
- Check if token was acquired successfully

### Step 5: Verify Response
- Check if `source: "azure_ad"` (working) or `source: "simulated_directory"` (fallback)
- Check if name, department, position are filled

---

## 🐛 Troubleshooting

### Problem: 403 Forbidden
**Solution:**
1. Go to Azure Portal → App registrations → Your app
2. API permissions → Add permission
3. Microsoft Graph → **Application permissions** (NOT Delegated!)
4. Search "User.Read.All" → Add
5. **Grant admin consent** (requires admin privileges)
6. Restart dev server

### Problem: 401 Unauthorized
**Solution:**
1. Check `.env.local` file
2. Verify `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` are correct
3. Check if client secret expired (create new one if needed)
4. Restart dev server after updating `.env.local`

### Problem: User not found (404)
**This is normal!** - User doesn't exist in Azure AD
- System will use fallback directory
- Registration will still work

### Problem: No logs at all
**Solution:**
1. Make sure dev server is running
2. Check if you're calling the right endpoint
3. Check browser console for errors

---

## 📝 Quick Test Script

**Copy this to test multiple emails:**

```javascript
// Run in browser console (F12) on http://localhost:3000
const testEmails = [
  'faculty.cnahs@mseuf.edu.ph',
  'head.nursing@mseuf.edu.ph',
  'test@mseuf.edu.ph'
];

testEmails.forEach(async (email) => {
  const res = await fetch(`/api/email-directory?email=${email}`);
  const data = await res.json();
  console.log(`\n📧 ${email}:`, data);
});
```

---

## ✅ Success Criteria

Azure AD integration is working if:
1. ✅ Terminal shows: `✅ Azure AD token acquired successfully`
2. ✅ Terminal shows: `✅ User found in Azure AD`
3. ✅ API response has: `"source": "azure_ad"`
4. ✅ Registration page auto-fills name and department
5. ✅ No 403 or 401 errors in terminal

---

## 🎯 Next Steps After Testing

**If working:**
- ✅ Great! Azure AD integration is set up correctly
- You can now use real Azure AD data for user lookups

**If not working:**
- Check the error message in terminal
- Follow the troubleshooting steps above
- Most common issue: Missing `User.Read.All` Application permission

