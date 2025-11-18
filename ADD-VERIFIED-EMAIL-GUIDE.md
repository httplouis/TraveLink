# 📧 Add Verified Email to Resend

## ✅ Email Configuration Updated

I've updated the email configuration to use the new API key for `a22-34939@student.mseuf.edu.ph`.

**API Key:** `re_643gMPn1_HWKhe1qgnkrcmpnydmiKD9P8`  
**Email:** `a22-34939@student.mseuf.edu.ph`

## 🔧 Manual Steps to Verify Email in Resend

Since Resend doesn't provide a public API to add verified recipients, you need to manually add it in the Resend dashboard:

### Step 1: Login to Resend Dashboard

1. Go to [https://resend.com](https://resend.com)
2. Login with the account that has API key `re_643gMPn1_HWKhe1qgnkrcmpnydmiKD9P8`

### Step 2: Add Verified Email

**Option A: If Resend Dashboard Has "Verified Emails" Section**

1. Go to **Settings** or **Verified Emails** section (left sidebar)
2. Click **Add Email** or **Verify Email**
3. Enter: `a22-34939@student.mseuf.edu.ph`
4. Click **Send Verification Email**
5. Check the inbox for `a22-34939@student.mseuf.edu.ph`
6. Click the verification link in the email
7. Email will be marked as verified ✅

**Option B: If Using Free Tier (No Verified Emails Section)**

⚠️ **Note:** Resend's free tier may not have a "Verified Emails" section. In this case:

1. **Verify Domain Instead (Recommended):**
   - Go to **Domains** section
   - Add domain: `student.mseuf.edu.ph` or `mseuf.edu.ph`
   - Add DNS records provided by Resend
   - Once verified, you can send to ANY email under that domain

2. **Or Use Account Owner's Email:**
   - Free tier can send to the account owner's email (the one used to sign up)
   - Make sure `a22-34939@student.mseuf.edu.ph` is the account owner's email

### Step 3: Test Email Sending

After verification, test by sending an email to `a22-34939@student.mseuf.edu.ph`:

```bash
# The code will automatically use the correct API key
# when sending to a22-34939@student.mseuf.edu.ph
```

## 📝 Code Changes Made

Updated `src/lib/email.ts` to automatically use API key `re_643gMPn1_HWKhe1qgnkrcmpnydmiKD9P8` when sending emails to `a22-34939@student.mseuf.edu.ph`.

## 🔍 Verify It's Working

1. Check Resend dashboard → **Emails** section
2. Look for sent emails to `a22-34939@student.mseuf.edu.ph`
3. Check delivery status (should be "Delivered" ✅)

## ⚠️ Important Notes

- **Free Tier Limitation:** If you're on free tier, you can only send to:
  - Verified domain emails (unlimited)
  - Account owner's email
  - Manually verified emails (if feature available)

- **Best Solution:** Verify the domain `student.mseuf.edu.ph` or `mseuf.edu.ph` to send to ANY email under that domain without individual verification.

## 🚀 Next Steps

1. ✅ Code updated - API key configured
2. ⏳ **You need to:** Verify email in Resend dashboard (or verify domain)
3. ✅ Test email sending after verification

---

**Need Help?** Check Resend documentation: [https://resend.com/docs](https://resend.com/docs)

