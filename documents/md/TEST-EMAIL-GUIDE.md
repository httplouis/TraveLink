# 📧 How to Test Email Invitations

## 🧪 Quick Test Methods

### Method 1: Use Test Email Endpoint (Easiest)

1. **Open Browser Console** (F12)
2. **Run this command:**
```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'your-email@example.com' // Replace with your email
  })
})
.then(r => r.json())
.then(data => {
  console.log('📧 Test Result:', data);
  if (data.resendUrl) {
    console.log('🔗 Check delivery:', data.resendUrl);
    window.open(data.resendUrl, '_blank');
  }
});
```

3. **Check your email inbox** (may take a few seconds)
4. **Check Resend dashboard** if you got an `emailId`

---

### Method 2: Test from Seminar Form

1. **Create a seminar request** (save as draft or submit)
2. **Add participant email** in the "Participants" section
3. **Click "Send Invitation"**
4. **Check browser console** (F12) for logs:
   - Look for `[POST /api/participants/invite]` logs
   - Look for `[sendEmail]` logs
   - Look for email ID or errors

5. **Check server terminal** for detailed logs:
   ```
   [POST /api/participants/invite] 📧 Email result: { success: true, emailId: "..." }
   [POST /api/participants/invite] 📧 Check delivery at: https://resend.com/emails/...
   ```

---

### Method 3: Check Resend Dashboard

1. **Go to [Resend Dashboard](https://resend.com/emails)**
2. **Login** with your Resend account
3. **Check "Emails" tab** - you'll see all sent emails
4. **Click on an email** to see:
   - Delivery status
   - Opened status
   - Clicked links
   - Bounce/spam reports

---

## 🔍 What to Check

### ✅ Success Indicators:
- ✅ Console shows: `Email sent successfully`
- ✅ Console shows: `Email ID: re_...`
- ✅ Toast shows: "Invitation sent"
- ✅ Email appears in Resend dashboard
- ✅ Email received in inbox (check spam folder too!)

### ❌ Failure Indicators:
- ❌ Console shows: `Email sending failed`
- ❌ Toast shows: "Email could not be sent"
- ❌ Modal shows with confirmation link (means email failed but link is available)
- ❌ No email in Resend dashboard

---

## 🐛 Troubleshooting

### Problem: "No API key - logging to console instead"
**Solution:** Add `RESEND_API_KEY` to `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
```

### Problem: "Domain not verified"
**Solution:** 
- Use test domain: `onboarding@resend.dev` (already configured)
- Or verify your domain in Resend dashboard

### Problem: Email not received
**Check:**
1. ✅ Spam/junk folder
2. ✅ Resend dashboard - see delivery status
3. ✅ Console logs - check for errors
4. ✅ Email address is correct

### Problem: 403 Forbidden
**Solution:** 
- Code automatically retries with test domain
- Check Resend API key is valid
- Check Resend account has sending quota

---

## 📊 Check Email Status

### In Browser Console:
After sending, look for:
```javascript
[POST /api/participants/invite] 📧 Email ID: re_abc123...
[POST /api/participants/invite] 📧 Check delivery at: https://resend.com/emails/re_abc123...
```

### In Resend Dashboard:
1. Go to https://resend.com/emails
2. Find your email by:
   - Email ID (from console)
   - Recipient email
   - Date/time
3. Click to see:
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ❌ Bounced
   - ❌ Spam

---

## 🎯 Quick Test Checklist

- [ ] `RESEND_API_KEY` is set in `.env.local`
- [ ] Restarted dev server after adding API key
- [ ] Test email endpoint works (`/api/test-email`)
- [ ] Console shows email ID after sending
- [ ] Email appears in Resend dashboard
- [ ] Email received in inbox (check spam!)
- [ ] Confirmation link works when clicked

---

## 💡 Pro Tips

1. **Use your own email** for testing first
2. **Check console logs** - they show everything
3. **Check Resend dashboard** - most reliable way to verify
4. **Test with multiple emails** - some providers filter differently
5. **Check spam folder** - emails might go there initially

---

## 🔗 Useful Links

- [Resend Dashboard](https://resend.com/emails)
- [Resend API Docs](https://resend.com/docs)
- [Resend Domain Setup](https://resend.com/domains)

---

**Happy Testing! 🚀**

