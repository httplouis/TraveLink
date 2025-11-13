# 🔐 Resend Domain Verification Guide

## ⚠️ Current Issue

**Error:** `You can only send testing emails to your own email address (joselouis.rosales.cdscdb@gmail.com)`

**Cause:** Resend's free/test account only allows sending to the account owner's email.

**Solution:** Verify a domain in Resend to send emails to any recipient.

---

## ✅ Solution 1: Verify Domain (For Production)

### Step 1: Go to Resend Dashboard

1. Login to [https://resend.com](https://resend.com)
2. Go to **Domains** section (left sidebar)
3. Click **Add Domain**

### Step 2: Add Your Domain

**Option A: Use MSEUF Domain (Recommended)**
- Domain: `mseuf.edu.ph`
- Or subdomain: `travilink.mseuf.edu.ph`

**Option B: Use Custom Domain**
- Any domain you own (e.g., `yourdomain.com`)

### Step 3: Add DNS Records

Resend will show you DNS records to add:

**Example DNS Records:**
```
Type: TXT
Name: @
Value: resend-verification=abc123...

Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10

Type: CNAME
Name: resend
Value: resend.net
```

### Step 4: Add to Domain Registrar

1. Go to your domain registrar (where you manage DNS)
2. Add all DNS records Resend provided
3. Wait 5-30 minutes for DNS propagation

### Step 5: Verify in Resend

1. Go back to Resend dashboard
2. Wait for status to change to **"Verified"** ✅
3. This may take 5-30 minutes

### Step 6: Update `.env.local`

```bash
EMAIL_FROM=noreply@mseuf.edu.ph
# OR
EMAIL_FROM=noreply@travilink.mseuf.edu.ph
```

### Step 7: Restart Dev Server

```bash
# Stop (Ctrl+C)
pnpm dev
```

---

## ✅ Solution 2: Test with Your Own Email (Quick Testing)

**For testing purposes only:**

1. **Use your verified email** (`joselouis.rosales.cdscdb@gmail.com`) as the recipient
2. **Or** add a check in the code to only send to verified emails during development

---

## ✅ Solution 3: Development Mode (Console Logging)

**If you can't verify domain yet:**

The code already has fallback to console logging if email sending fails. You can:

1. **Check terminal** for email content
2. **Copy confirmation link** from terminal
3. **Share link manually** with participants

---

## 📝 For Vercel Deployment

When deploying to Vercel:

1. **Verify domain** in Resend (same steps above)
2. **Set environment variables** in Vercel:
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@mseuf.edu.ph
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
3. **Redeploy** - emails will work!

---

## 🆘 Troubleshooting

### "Domain not verified"

**Fix:**
- Check DNS records are added correctly
- Wait 30 minutes for DNS propagation
- Check Resend dashboard for verification status

### "Still can't send emails"

**Fix:**
- Make sure `EMAIL_FROM` uses verified domain
- Restart dev server after changing `.env.local`
- Check Resend dashboard for any errors

---

## 💡 Quick Test

**After verifying domain:**

1. Update `.env.local`:
   ```bash
   EMAIL_FROM=noreply@mseuf.edu.ph
   ```

2. Restart dev server

3. Send invitation to any email

4. Should work! ✅

---

**For now, you can test by:**
- Sending invitations to `joselouis.rosales.cdscdb@gmail.com` (your verified email)
- Or check terminal for email content and share links manually

**For production, verify the domain!** 🚀

