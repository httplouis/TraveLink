# ⚡ Quick Email Check Guide

## 🎯 3 Ways to Check Email Status

### 1️⃣ Browser Console (F12) - Easiest!

**After sending invitation, look for:**

```javascript
✅ SUCCESS:
[ParticipantInvitationEditor] ✅ Email sent! ID: re_abc123...
[ParticipantInvitationEditor] 🔗 Check delivery: https://resend.com/emails/re_abc123...

❌ FAILED:
[POST /api/participants/invite] ⚠️ Email sending failed: ...
```

**Action:** Click the Resend dashboard link to see delivery status!

---

### 2️⃣ Resend Dashboard - Most Reliable!

**Go to:** https://resend.com/emails

**You'll see:**
- ✅ All sent emails
- ✅ Delivery status (Delivered/Bounced/Spam)
- ✅ Opened status
- ✅ Clicked links
- ✅ Error messages

---

### 3️⃣ Test Email Endpoint - Quick Test!

**In Browser Console (F12), run:**

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'joselouis.rosales.cdscdb@gmail.com' })
})
.then(r => r.json())
.then(data => {
  console.log('📧 Result:', data);
  if (data.resendUrl) window.open(data.resendUrl, '_blank');
});
```

---

## ⚠️ Current Issue: 403 Error

**Problem:** 
```
You can only send testing emails to your own email address 
(joselouis.rosales.cdscdb@gmail.com)
```

**Solution:**
1. **Test with your email first:** `joselouis.rosales.cdscdb@gmail.com`
2. **Check if it works**
3. **For other emails:** Need to verify domain (see `RESEND-DOMAIN-VERIFICATION-GUIDE.md`)

---

## ✅ Success Checklist

- [ ] Console shows `emailId: "re_..."`
- [ ] Resend dashboard opens automatically
- [ ] Email appears in Resend dashboard
- [ ] Email received in inbox (check spam!)
- [ ] Confirmation link works

---

**That's it! 🚀**

