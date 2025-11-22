# 🔧 Fix Resend DNS Verification - FAILED Status

## ⚠️ Current Status: FAILED

Nakita ko na ang domain `mseuf.edu.ph` ay **"Failed"** status. Lahat ng DNS records ay showing "Failed".

### What This Means:
- ❌ Resend cannot find the DNS records
- ❌ Records might be missing, incorrect, or not propagated yet
- ❌ Need to check and fix DNS records in Cloudflare

---

## 🔍 Step 1: Check DNS Records in Cloudflare

### Go to Cloudflare Dashboard:
1. **Login** sa [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Select** `mseuf.edu.ph` domain
3. **Go to** DNS → Records
4. **Check** kung may records na nakalista

---

## 📋 Required DNS Records

### 1. Domain Verification (DKIM) - REQUIRED
- **Type:** `TXT`
- **Name:** `resend._domainkey`
- **Content:** `p=MIGfMA0GCSqGSIb3DQEB...` (full value from Resend)
- **TTL:** `Auto` or `3600`

### 2. Enable Sending (SPF & DMARC) - REQUIRED

#### MX Record:
- **Type:** `MX`
- **Name:** `send`
- **Content:** `feedback-smtp.ap-north...` (full value from Resend)
- **Priority:** `10`
- **TTL:** `Auto` or `3600`

#### SPF Record:
- **Type:** `TXT`
- **Name:** `send`
- **Content:** `v=spf1 include:amazons...` (full value from Resend)
- **TTL:** `Auto` or `3600`

#### DMARC Record (Optional but Recommended):
- **Type:** `TXT`
- **Name:** `_dmarc`
- **Content:** `v=DMARC1; p=none;`
- **TTL:** `Auto` or `3600`

---

## ✅ Step 2: Add/Verify Records in Cloudflare

### For Each Record:

1. **Click** "Add record" sa Cloudflare
2. **Select** Type (TXT or MX)
3. **Enter** Name (exact match - important!)
4. **Enter** Content (exact match - important!)
5. **Set** TTL to "Auto" or "3600"
6. **Set** Priority (for MX records only - should be 10)
7. **Click** "Save"

### ⚠️ Important Notes:

#### For TXT Records:
- **Name:** Must be EXACT match
  - ✅ `resend._domainkey` (correct)
  - ❌ `resend._domainkey.mseuf.edu.ph` (wrong - don't include domain)
  - ❌ `@` (wrong - use exact name)

#### For MX Records:
- **Name:** Must be `send` (not `send.mseuf.edu.ph`)
- **Content:** Must be exact value from Resend
- **Priority:** Must be `10`

#### For Content Values:
- **Copy EXACTLY** from Resend dashboard
- **No extra spaces** or characters
- **Case-sensitive** (usually lowercase)

---

## 🔍 Step 3: Verify Records Are Correct

### Check in Cloudflare:
1. **Go to** DNS → Records
2. **Find** each record:
   - `resend._domainkey` (TXT)
   - `send` (MX)
   - `send` (TXT)
   - `_dmarc` (TXT - optional)

3. **Verify:**
   - ✅ Name matches exactly
   - ✅ Content matches exactly
   - ✅ Type is correct
   - ✅ TTL is set

### Common Mistakes:

#### ❌ Wrong Name Format:
```
resend._domainkey.mseuf.edu.ph  ← WRONG (includes domain)
@                               ← WRONG (use exact name)
```

#### ✅ Correct Name Format:
```
resend._domainkey               ← CORRECT
send                            ← CORRECT
_dmarc                          ← CORRECT
```

#### ❌ Wrong Content:
```
p=MIGfMA0GCSqGSIb3DQEB... (with extra spaces)  ← WRONG
```

#### ✅ Correct Content:
```
p=MIGfMA0GCSqGSIb3DQEB... (exact copy)  ← CORRECT
```

---

## ⏳ Step 4: Wait for DNS Propagation

### After Adding Records:
1. **Wait** 5-30 minutes for DNS propagation
2. **Check** Resend dashboard - status should change from "Failed" to "Pending" then "Verified"
3. **If still failed after 30 minutes**, check records again

### DNS Propagation Time:
- **Cloudflare:** Usually 5-15 minutes
- **Other providers:** Can take up to 48 hours
- **Resend checks:** Every few hours automatically

---

## 🔄 Step 5: Restart Verification in Resend

### If Records Are Correct But Still Failed:

1. **Go to** Resend Dashboard
2. **Click** "Restart" button (top right)
3. **Wait** for Resend to re-check DNS records
4. **Status should update** within a few minutes

---

## 🆘 Troubleshooting

### Problem 1: "Record not found"

**Solution:**
- Check if record exists in Cloudflare
- Verify name is exact match (no domain suffix)
- Wait for DNS propagation

### Problem 2: "Content mismatch"

**Solution:**
- Copy exact content from Resend
- Remove any extra spaces or characters
- Check if content is case-sensitive

### Problem 3: "Still failed after 30 minutes"

**Solution:**
1. Double-check all records in Cloudflare
2. Verify exact name and content match
3. Click "Restart" in Resend dashboard
4. Wait another 30 minutes
5. Contact Resend support if still failing

### Problem 4: "Can't add record in Cloudflare"

**Solution:**
- Check if you have admin access to Cloudflare
- Verify domain is properly added to Cloudflare
- Try adding record manually (not via Resend's Cloudflare integration)

---

## 📝 Quick Checklist

- [ ] All DNS records added in Cloudflare
- [ ] Names match exactly (no domain suffix)
- [ ] Content matches exactly (no extra spaces)
- [ ] TTL set to Auto or 3600
- [ ] Priority set to 10 (for MX records)
- [ ] Waited 5-30 minutes for propagation
- [ ] Clicked "Restart" in Resend dashboard
- [ ] Checked Resend status again

---

## 🎯 Expected Result

After fixing:
- ✅ Status changes from "Failed" to "Pending"
- ✅ Then "Pending" to "Verified" ✅
- ✅ Can use `@mseuf.edu.ph` email addresses
- ✅ Full email functionality enabled

---

## 💡 Quick Fix Steps

1. **Go to Cloudflare** → DNS → Records
2. **Check** if all 4 records exist:
   - `resend._domainkey` (TXT)
   - `send` (MX, Priority 10)
   - `send` (TXT)
   - `_dmarc` (TXT, optional)
3. **Verify** names and content match Resend exactly
4. **Wait** 15-30 minutes
5. **Click** "Restart" in Resend dashboard
6. **Check** status again

---

## 📞 Need Help?

If still failing after following all steps:
1. **Screenshot** your Cloudflare DNS records
2. **Screenshot** Resend dashboard
3. **Contact** Resend support with screenshots
4. **Or** use test domain (`onboarding@resend.dev`) for now

**Good luck! 🚀**

