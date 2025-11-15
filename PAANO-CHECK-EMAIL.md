# 📧 Paano i-Check at i-Confirm ang Email Invitations

## 🎯 Quick Steps (Pinakamadali)

### Method 1: Check Browser Console (F12)

1. **I-open ang Browser Console** (Press `F12` o `Ctrl+Shift+I`)
2. **Mag-send ng invitation** sa seminar form
3. **Hanapin ang logs** na ganito:

```javascript
[ParticipantInvitationEditor] 📤 sendInvitation called for: a22-34976@student.mseuf.edu.ph
[POST /api/participants/invite] 📧 Email result: { success: true, emailId: "re_abc123..." }
```

4. **Kung may `emailId`**, i-click ang link:
   ```
   https://resend.com/emails/re_abc123...
   ```
   - Makikita mo doon ang delivery status
   - Kung delivered, opened, clicked, etc.

---

### Method 2: Check Terminal/Server Logs

1. **Hanapin ang terminal** kung saan nag-run ang `pnpm dev`
2. **Mag-send ng invitation**
3. **Hanapin ang logs** na ganito:

```
[POST /api/participants/invite] 📧 Email result: {
  success: true,
  emailId: "re_abc123..."
}
[sendEmail] 📧 Resend Email ID: re_abc123...
[sendEmail] 📧 Check delivery status at: https://resend.com/emails/re_abc123...
```

---

### Method 3: Use Test Email Endpoint

**Sa Browser Console (F12), i-run ito:**

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'joselouis.rosales.cdscdb@gmail.com' // Your email
  })
})
.then(r => r.json())
.then(data => {
  console.log('📧 Test Result:', data);
  if (data.resendUrl) {
    console.log('🔗 Check delivery:', data.resendUrl);
    window.open(data.resendUrl, '_blank'); // Auto-open Resend dashboard
  }
});
```

**Dapat makita mo:**
- ✅ `ok: true`
- ✅ `emailId: "re_..."` 
- ✅ `resendUrl: "https://resend.com/emails/..."`

---

### Method 4: Check Resend Dashboard (Pinaka-reliable)

1. **Go to:** [https://resend.com/emails](https://resend.com/emails)
2. **Login** sa Resend account
3. **Check "Emails" tab**
4. **Makikita mo:**
   - ✅ All sent emails
   - ✅ Delivery status (Delivered, Bounced, etc.)
   - ✅ Opened status
   - ✅ Clicked links
   - ✅ Error messages

---

## ⚠️ Current Issue (403 Error)

**Base sa logs mo, may 403 error:**

```
[sendEmail] Resend API error: {
  statusCode: 403,
  message: "You can only send testing emails to your own email address (joselouis.rosales.cdscdb@gmail.com)"
}
```

**Ibig sabihin:**
- ❌ Resend test account lang ang gamit mo
- ❌ Pwede lang mag-send sa `joselouis.rosales.cdscdb@gmail.com`
- ❌ Hindi pwede sa ibang email (like `a22-34976@student.mseuf.edu.ph`)

**Solution:**
1. **Option A: Test with your email first**
   - Use `joselouis.rosales.cdscdb@gmail.com` for testing
   - Check if email is received
   - Check Resend dashboard

2. **Option B: Verify domain** (Para makapag-send sa lahat)
   - Follow `RESEND-DOMAIN-VERIFICATION-GUIDE.md`
   - After verification, pwede na sa lahat ng email

---

## ✅ Success Indicators

**Kung successful:**
- ✅ Console shows: `success: true`
- ✅ Console shows: `emailId: "re_..."`
- ✅ Toast shows: "Invitation sent"
- ✅ Email appears sa Resend dashboard
- ✅ Email received sa inbox (check spam folder!)

**Kung failed:**
- ❌ Console shows: `success: false`
- ❌ Console shows: `error: "..."` 
- ❌ Toast shows: "Email could not be sent"
- ❌ Modal shows with confirmation link (fallback)

---

## 🔍 Step-by-Step Verification

### Step 1: Check if Email was Sent
```javascript
// Sa browser console, after sending:
// Look for:
[POST /api/participants/invite] 📧 Email result: { success: true, emailId: "..." }
```

### Step 2: Check Resend Dashboard
1. Go to: https://resend.com/emails
2. Find the email by:
   - Email ID (from console)
   - Recipient email
   - Date/time
3. Click to see:
   - ✅ **Delivered** - Email was sent successfully
   - ✅ **Opened** - Recipient opened the email
   - ✅ **Clicked** - Recipient clicked the link
   - ❌ **Bounced** - Email address invalid
   - ❌ **Spam** - Marked as spam

### Step 3: Check Email Inbox
1. **Check inbox** ng recipient
2. **Check spam/junk folder** (baka nandun)
3. **Check "All Mail"** sa Gmail
4. **Search for:** "Seminar Participation Invitation"

### Step 4: Test Confirmation Link
1. **Copy the confirmation link** from:
   - Email body
   - Browser console
   - Resend dashboard
2. **Open in browser**
3. **Should show:** Confirmation page with form

---

## 🧪 Quick Test Checklist

- [ ] `RESEND_API_KEY` is set in `.env.local`
- [ ] Restarted dev server after adding API key
- [ ] Test email endpoint works (`/api/test-email`)
- [ ] Console shows `emailId` after sending
- [ ] Email appears sa Resend dashboard
- [ ] Email received sa inbox (check spam!)
- [ ] Confirmation link works when clicked

---

## 💡 Pro Tips

1. **Use your own email first** (`joselouis.rosales.cdscdb@gmail.com`) for testing
2. **Check console logs** - they show everything
3. **Check Resend dashboard** - most reliable way to verify
4. **Check spam folder** - emails might go there initially
5. **Test with multiple emails** - some providers filter differently

---

## 🔗 Useful Links

- [Resend Dashboard](https://resend.com/emails) - Check all sent emails
- [Resend API Docs](https://resend.com/docs) - API documentation
- [Resend Domain Setup](https://resend.com/domains) - Verify domain

---

## 📝 Example: What to Look For

**Sa Browser Console:**
```javascript
[ParticipantInvitationEditor] 📤 sendInvitation called for: a22-34976@student.mseuf.edu.ph
[POST /api/participants/invite] 📧 Email result: {
  success: true,
  emailId: "re_abc123def456",
  resendUrl: "https://resend.com/emails/re_abc123def456"
}
```

**Sa Terminal:**
```
[sendEmail] 📧 Resend Email ID: re_abc123def456
[sendEmail] 📧 Check delivery status at: https://resend.com/emails/re_abc123def456
```

**Sa Resend Dashboard:**
- Status: ✅ Delivered
- Opened: ✅ Yes (if recipient opened)
- Clicked: ✅ Yes (if recipient clicked link)

---

**Happy Testing! 🚀**

