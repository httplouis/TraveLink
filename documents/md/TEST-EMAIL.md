# 📧 How to Test Email Sending

## 🧪 Method 1: Development Mode (Console Logging)

**Kung WALANG `RESEND_API_KEY` sa `.env.local`:**

1. **Send invitation** sa form
2. **Check terminal/console** - makikita mo ang email content doon
3. **Look for this output:**
   ```
   ============================================================
   📧 EMAIL WOULD BE SENT (No RESEND_API_KEY configured)
   ============================================================
   To: participant@email.com
   Subject: Seminar Participation Invitation: ...
   From: noreply@travilink.mseuf.edu.ph
   HTML Content: ...
   ============================================================
   ```

**Para makita ang full email content:**
- Open terminal/console where `pnpm dev` is running
- Scroll up to see the email HTML
- Copy the confirmation link from the console

---

## 🚀 Method 2: Real Email Sending (Production Mode)

**Para makareceive ng REAL emails sa Gmail:**

### Step 1: Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up (free - 100 emails/day)
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `re_...`)

### Step 2: Add to `.env.local`

Create or edit `.env.local` in project root:

```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM=noreply@travilink.mseuf.edu.ph
```

### Step 3: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
pnpm dev
```

### Step 4: Test Again

1. Send invitation ulit
2. Check Gmail inbox (and spam folder)
3. You should receive the email!

---

## 🔍 Troubleshooting

### "Wala pa ring email sa Gmail"

**Check these:**

1. **API Key set ba?**
   - Check `.env.local` file
   - Make sure `RESEND_API_KEY` is there
   - Restart dev server after adding

2. **Check terminal for errors:**
   - Look for `[sendEmail]` logs
   - If may error, makikita mo doon

3. **Check Resend Dashboard:**
   - Go to [resend.com/emails](https://resend.com/emails)
   - Makikita mo kung nagsend ba talaga
   - Check delivery status

4. **Check Spam Folder:**
   - Baka nasa spam/junk folder
   - Mark as "Not Spam" if nandun

5. **Domain Verification:**
   - Kung custom domain (`@mseuf.edu.ph`), kailangan verified
   - Use Resend's default domain muna for testing
   - Change `EMAIL_FROM` to: `onboarding@resend.dev` (Resend's test domain)

---

## 🎯 Quick Test Steps

1. **Check console first:**
   ```bash
   # Make sure terminal is visible
   # Send invitation
   # Look for email logs
   ```

2. **If walang API key:**
   - Email content will be in console
   - Copy the confirmation link from console
   - Test the link manually

3. **If may API key:**
   - Check Gmail inbox
   - Check spam folder
   - Check Resend dashboard for status

---

## 📝 Example Console Output (Development Mode)

```
============================================================
📧 EMAIL WOULD BE SENT (No RESEND_API_KEY configured)
============================================================
To: hansmadridano@gmail.com
Subject: Seminar Participation Invitation: Training Workshop
From: noreply@travilink.mseuf.edu.ph
HTML Content: <!DOCTYPE html>...
============================================================
```

**The confirmation link will be in the HTML content!**

---

## ✅ Success Indicators

**Development Mode:**
- ✅ See email logs in console
- ✅ Can copy confirmation link from console

**Production Mode:**
- ✅ Email appears in Resend dashboard
- ✅ Email received in Gmail inbox
- ✅ Confirmation link works when clicked

---

**Need help?** Check `EMAIL-SETUP.md` for detailed setup instructions.

