# 🔍 Debug Azure AD Integration

## Current Status: Using Fallback Directory

Nakita ko na `"source": "simulated_directory"` ang response, ibig sabihin:
- ⚠️ **Azure AD is NOT being used**
- ✅ **Fallback directory is working** (simulated data)

---

## Step 1: Check Environment Variables

**Open** `.env.local` file at verify na may:

```env
AZURE_CLIENT_ID=your-client-id-here
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
```

**Important:**
- ✅ Dapat walang spaces sa `=` sign
- ✅ Dapat walang quotes (`"` o `'`)
- ✅ Dapat complete ang values

**Example (CORRECT):**
```env
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321
AZURE_CLIENT_SECRET=abc123~XYZ789
```

**Example (WRONG):**
```env
AZURE_CLIENT_ID = "12345678-1234-1234-1234-123456789abc"  ❌ May spaces at quotes
AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321      ✅ Correct
```

---

## Step 2: Restart Server (CRITICAL!)

**Environment variables ay na-load lang kapag nag-start ang server!**

1. **Stop** ang server:
   - Press `Ctrl + C` sa terminal
   - Wait for "Stopped" message

2. **Start** ulit:
   ```bash
   pnpm dev
   ```

3. **Wait** for "Ready" message

---

## Step 3: Check Terminal Logs

**After restarting, test ulit ang API:**

1. **Open** browser:
   ```
   http://localhost:3000/api/email-directory?email=head.nursing@mseuf.edu.ph
   ```

2. **Check** terminal logs - dapat may:
   ```
   [email-directory] 🔍 Checking Azure AD configuration...
   [email-directory] AZURE_CLIENT_ID exists: true/false
   [email-directory] AZURE_TENANT_ID exists: true/false
   [email-directory] AZURE_CLIENT_SECRET exists: true/false
   ```

### Possible Logs:

#### ✅ If Environment Variables are Loaded:
```
[email-directory] 🔍 Checking Azure AD configuration...
[email-directory] AZURE_CLIENT_ID exists: true
[email-directory] AZURE_CLIENT_ID length: 36
[email-directory] AZURE_TENANT_ID exists: true
[email-directory] AZURE_CLIENT_SECRET exists: true
[email-directory] ✅ Azure AD credentials found, attempting lookup...
```

#### ❌ If Environment Variables are Missing:
```
[email-directory] 🔍 Checking Azure AD configuration...
[email-directory] AZURE_CLIENT_ID exists: false
[email-directory] AZURE_CLIENT_ID length: 0
[email-directory] ❌ Azure AD not configured, using fallback directory
[email-directory] Missing variables: { clientId: true, tenantId: true, clientSecret: true }
```

#### ⚠️ If Azure AD Token Failed:
```
[email-directory] ✅ Azure AD credentials found, attempting lookup...
[email-directory] ❌ Failed to get Azure AD token
[email-directory] Status: 401
[email-directory] Error: { error: "invalid_client", ... }
```

#### ⚠️ If Admin Consent Not Granted:
```
[email-directory] ✅ Azure AD token acquired successfully
[email-directory] ⚠️ User not found in Azure AD: head.nursing@mseuf.edu.ph
[email-directory] Graph API status: 403
[email-directory] Graph API error: { error: { code: "Authorization_RequestDenied", ... } }
```

---

## Step 4: Common Issues & Solutions

### Issue 1: Environment Variables Not Loading

**Symptoms:**
- Logs show `AZURE_CLIENT_ID exists: false`
- Still using `simulated_directory`

**Solutions:**
1. ✅ Check `.env.local` file location (dapat sa root ng project)
2. ✅ Check syntax (walang spaces, walang quotes)
3. ✅ Restart server (important!)
4. ✅ Check file name (dapat `.env.local`, hindi `.env` o `.env.local.txt`)

### Issue 2: Invalid Credentials

**Symptoms:**
- Logs show `Failed to get Azure AD token`
- Status: 401 or 400

**Solutions:**
1. ✅ Verify `AZURE_CLIENT_ID` - dapat correct
2. ✅ Verify `AZURE_TENANT_ID` - dapat correct
3. ✅ Verify `AZURE_CLIENT_SECRET` - dapat correct at hindi expired
4. ✅ Check Azure portal - dapat active ang app registration

### Issue 3: Admin Consent Not Granted

**Symptoms:**
- Logs show `User not found in Azure AD`
- Graph API status: 403
- Error: `Authorization_RequestDenied`

**Solutions:**
1. ✅ Grant admin consent sa Azure portal
2. ✅ Check kung may admin privileges ka
3. ✅ Contact IT Admin kung hindi mo ma-grant

---

## Quick Test After Fix

**After fixing, test ulit:**

1. **Restart** server
2. **Open** browser:
   ```
   http://localhost:3000/api/email-directory?email=head.nursing@mseuf.edu.ph
   ```
3. **Check** response - dapat may `"source": "azure_ad"` na
4. **Check** terminal logs - dapat may `✅` messages

---

## Next Steps

**Kung nakita mo na ang logs:**
1. **Copy** ang logs dito para ma-debug natin
2. **Check** kung ano ang specific error
3. **Fix** based on error message

**Kung wala pa ring environment variables:**
1. **Add** mo na sa `.env.local`
2. **Restart** server
3. **Test** ulit

