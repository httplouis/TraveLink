# Check Email for a22-33538@student.mseuf.edu.ph

## ✅ Updated API Key

The API key for `a22-33538@student.mseuf.edu.ph` has been updated to:
```
re_eyeNuzSw_GpBEeL6gQHk9jepC7W4pEjPX
```

## 🔍 How to Verify Email Sending

### Step 1: Check Environment Variables

Make sure `RESEND_API_KEY_2` is set in your `.env.local`:

```bash
RESEND_API_KEY_2=re_eyeNuzSw_GpBEeL6gQHk9jepC7W4pEjPX
```

**OR** the code will use the hardcoded fallback if env var is not set.

### Step 2: Restart Dev Server

After updating the API key, restart your dev server:

```bash
# Stop server (Ctrl+C)
pnpm dev
```

### Step 3: Check Server Logs

When sending an invitation to `a22-33538@student.mseuf.edu.ph`, you should see:

```
[sendEmail] 🔑 Using API key 2 for a22-33538@student.mseuf.edu.ph
[sendEmail] ✅ Email sent to a22-33538@student.mseuf.edu.ph
[sendEmail] 📧 Resend Email ID: re_...
[sendEmail] 📧 Check delivery status at: https://resend.com/emails/re_...
```

### Step 4: Check Resend Dashboard

1. Go to: https://resend.com/emails
2. Login with the account that has API key `re_eyeNuzSw_GpBEeL6gQHk9jepC7W4pEjPX`
3. Check if the email appears in the dashboard
4. Check the delivery status

### Step 5: Verify Email Address in Resend

**IMPORTANT:** Resend free tier can only send to:
- Verified email addresses
- The account owner's email (the email used to sign up for Resend)

**To send to `a22-33538@student.mseuf.edu.ph`:**
1. Make sure the Resend account was created using `a22-33538@student.mseuf.edu.ph`
2. OR verify the domain `mseuf.edu.ph` in Resend
3. OR add `a22-33538@student.mseuf.edu.ph` as a verified recipient

## 🐛 Troubleshooting

### Email Not Received

**Check these:**

1. **API Key Correct?**
   - Verify the API key in Resend dashboard
   - Make sure it matches: `re_eyeNuzSw_GpBEeL6gQHk9jepC7W4pEjPX`

2. **Email Verified in Resend?**
   - Free tier can only send to verified emails
   - Check Resend dashboard → Settings → Verified Emails

3. **Check Spam Folder**
   - Sometimes emails go to spam
   - Check spam/junk folder in Gmail

4. **Check Server Logs**
   - Look for `[sendEmail]` logs in terminal
   - Check for any error messages

5. **Check Resend Dashboard**
   - Go to https://resend.com/emails
   - See if email was sent
   - Check delivery status

### Common Errors

**Error: "Can only send to verified email addresses"**
- Solution: Verify `a22-33538@student.mseuf.edu.ph` in Resend dashboard
- OR use the email that was used to sign up for Resend

**Error: "Domain not verified"**
- Solution: Verify `mseuf.edu.ph` domain in Resend
- OR use `onboarding@resend.dev` as sender (already configured)

**No Error but No Email**
- Check spam folder
- Check Resend dashboard for delivery status
- Verify email address is correct

## 📧 Test Email Sending

To test if email is working:

1. Send a requester invitation to `a22-33538@student.mseuf.edu.ph`
2. Check terminal logs for `[sendEmail]` messages
3. Check Resend dashboard: https://resend.com/emails
4. Check Gmail inbox (and spam folder)

## 🔗 Quick Links

- Resend Dashboard: https://resend.com/emails
- Resend API Keys: https://resend.com/api-keys
- Resend Verified Emails: https://resend.com/emails/verified
- Resend Domains: https://resend.com/domains

