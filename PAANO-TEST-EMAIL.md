# 📧 Paano i-Test ang Email Sending

## 🧪 Method 1: Development Mode (Console Logging) - WALANG API KEY

**Kung WALANG `RESEND_API_KEY` sa `.env.local`:**

### Step 1: Check Terminal/Console
1. **Hanapin ang terminal** kung saan nag-run ang `pnpm dev`
2. **Send invitation** sa form (click "Send Invitation" button)
3. **Tingnan ang terminal** - makikita mo ang email content doon

### Step 2: Look for This Output
```
============================================================
📧 EMAIL WOULD BE SENT (No RESEND_API_KEY configured)
============================================================
To: hansmadridano@gmail.com
Subject: Seminar Participation Invitation: ...
From: noreply@travilink.mseuf.edu.ph

🔗 CONFIRMATION LINK:
http://localhost:3000/participants/confirm/abc123...

📄 HTML Content (first 300 chars):
...
============================================================
```

### Step 3: Copy the Confirmation Link
- **Copy yung link** na nasa terminal
- **Paste sa browser** para ma-test ang confirmation page
- **Or share mo sa participant** para ma-test nila

---

## 🚀 Method 2: Real Email Sending (Production Mode) - MAY API KEY

**Para makareceive ng REAL emails sa Gmail:**

### Step 1: Get Resend API Key (FREE)

1. **Go to:** [https://resend.com](https://resend.com)
2. **Sign up** (free - 100 emails/day)
3. **Go to:** API Keys → Create API Key
4. **Copy the key** (starts with `re_...`)

### Step 2: Add to `.env.local`

**Create or edit `.env.local` file** sa project root:

```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM=onboarding@resend.dev
```

**Note:** 
- `onboarding@resend.dev` - Resend's test domain (no verification needed)
- Or use your own domain if verified

### Step 3: Restart Dev Server

```bash
# Stop the server (Ctrl+C sa terminal)
# Then restart:
pnpm dev
```

### Step 4: Test Again

1. **Send invitation** ulit
2. **Check Gmail inbox** (and spam folder!)
3. **Dapat may email na!** ✅

---

## 🔍 Troubleshooting

### "Wala pa ring email sa Gmail"

**Check these in order:**

1. **API Key set ba?**
   - Open `.env.local` file
   - Make sure `RESEND_API_KEY=re_...` is there
   - **Restart dev server** after adding (important!)

2. **Check terminal for errors:**
   - Look for `[sendEmail]` logs
   - If may error, makikita mo doon
   - Example: `[sendEmail] Resend API error: ...`

3. **Check Resend Dashboard:**
   - Go to [resend.com/emails](https://resend.com/emails)
   - Login to your account
   - Makikita mo kung nagsend ba talaga
   - Check delivery status (sent, delivered, bounced, etc.)

4. **Check Spam/Junk Folder:**
   - Baka nasa spam folder
   - Mark as "Not Spam" if nandun
   - Add sender to contacts

5. **Domain Issue:**
   - If using custom domain, kailangan verified
   - Use `onboarding@resend.dev` muna for testing
   - Change `EMAIL_FROM` to: `onboarding@resend.dev`

---

## 🎯 Quick Test Checklist

- [ ] **Check terminal** - nakita mo ba ang email logs?
- [ ] **API key set?** - check `.env.local`
- [ ] **Restart server?** - after adding API key
- [ ] **Check Gmail inbox** - including spam folder
- [ ] **Check Resend dashboard** - delivery status
- [ ] **Confirmation link works?** - click mo yung link sa email

---

## 📝 Example Terminal Output (Development Mode)

```
============================================================
📧 EMAIL WOULD BE SENT (No RESEND_API_KEY configured)
============================================================
To: hansmadridano@gmail.com
Subject: Seminar Participation Invitation: Training Workshop
From: noreply@travilink.mseuf.edu.ph

🔗 CONFIRMATION LINK:
http://localhost:3000/participants/confirm/abc123def456...

📄 HTML Content (first 300 chars):
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
...
============================================================
```

**Yung confirmation link ang importante!** Copy mo yan at i-test sa browser.

---

## ✅ Success Indicators

**Development Mode (No API Key):**
- ✅ See email logs in terminal
- ✅ Can copy confirmation link from terminal
- ✅ Link works when opened in browser

**Production Mode (With API Key):**
- ✅ Email appears in Resend dashboard
- ✅ Email received in Gmail inbox
- ✅ Confirmation link works when clicked
- ✅ Status shows "delivered" in Resend

---

## 💡 Tips

1. **For quick testing:** Use development mode muna (no API key needed)
2. **For real emails:** Set up Resend API key
3. **Always check spam folder** - baka nandun
4. **Use Resend dashboard** - para makita ang delivery status
5. **Test with your own email first** - before sending to others

---

**Need more help?** Check `EMAIL-SETUP.md` for detailed setup instructions.

