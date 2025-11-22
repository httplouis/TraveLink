# 📧 Paano Makita ang Email Logs

## ⚠️ IMPORTANT: Check TERMINAL, NOT Browser Console!

Ang email logs ay nasa **TERMINAL** (kung saan nag-run ang `pnpm dev`), hindi sa browser console!

---

## 🧪 Step-by-Step:

### 1. **Open Terminal**
- Hanapin ang terminal/command prompt kung saan nag-run ang `pnpm dev`
- Dapat nakikita mo ang: `▲ Next.js 15.x.x` at `- Local: http://localhost:3000`

### 2. **Send Invitation**
- Click "Send Invitation" button sa form
- **DON'T look at browser console** - look at TERMINAL instead!

### 3. **Check Terminal Output**
Dapat makikita mo sa terminal:

```
======================================================================
[POST /api/participants/invite] 🚀 API Route Called!
======================================================================
[POST /api/participants/invite] 📥 Request body: { request_id: '...', email: '...' }
[POST /api/participants/invite] 📧 Preparing to send email to ...
[POST /api/participants/invite] 📧 Email details: { to: '...', ... }
[POST /api/participants/invite] 📧 Calling sendEmail function...
[sendEmail] 🚀 Function called with: { to: '...', ... }
[sendEmail] 🔑 API Key check: ❌ Not found (will use console logging)
[sendEmail] 📝 No API key - logging to console instead...
======================================================================
📧 EMAIL WOULD BE SENT (No RESEND_API_KEY configured)
======================================================================
To: joselouis.rosales.cdscdb@gmail.com
Subject: Seminar Participation Invitation: ...
From: noreply@travilink.mseuf.edu.ph

🔗 CONFIRMATION LINK:
http://localhost:3000/participants/confirm/abc123def456...

📄 HTML Content (first 300 chars):
...
======================================================================
```

---

## 🚀 Para Makareceive ng REAL Email sa Gmail:

### Step 1: Get Resend API Key
1. Go to [https://resend.com](https://resend.com)
2. Sign up (free - 100 emails/day)
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `re_...`)

### Step 2: Add to `.env.local`
Create or edit `.env.local` file sa project root:

```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM=onboarding@resend.dev
```

### Step 3: Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
pnpm dev
```

### Step 4: Test Again
1. Send invitation ulit
2. Check Gmail inbox (and spam folder!)
3. Dapat may email na! ✅

---

## 🔍 Troubleshooting

### "Wala pa ring email sa Gmail"

**Check these:**

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
   - Check delivery status

4. **Check Spam/Junk Folder:**
   - Baka nasa spam folder
   - Mark as "Not Spam" if nandun

---

## 📝 Summary

- **Development (No API Key):** Emails logged sa TERMINAL only
- **Production (With API Key):** Real emails sent to Gmail
- **Always check TERMINAL** for email logs, not browser console!

