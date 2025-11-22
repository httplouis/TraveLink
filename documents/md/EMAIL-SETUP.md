# 📧 Email Setup Guide

The TraviLink application uses **Resend** for sending email notifications (participant invitations, etc.).

## 🚀 Quick Setup

### Step 1: Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free)
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy your API key (starts with `re_...`)

### Step 2: Add Environment Variable

Add this to your `.env.local` file (or Vercel environment variables):

```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com  # Optional: default sender email
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  # Optional: for production links
```

**Important Notes:**
- For **development**, you can leave `RESEND_API_KEY` empty - emails will be logged to console instead
- For **production**, you **must** set `RESEND_API_KEY`
- `EMAIL_FROM` must be a verified domain in Resend (or use Resend's default)
- `NEXT_PUBLIC_APP_URL` is used for confirmation links in emails

### Step 3: Verify Your Domain (Production Only)

1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `mseuf.edu.ph`)
3. Add the DNS records Resend provides
4. Wait for verification (usually a few minutes)

## 🧪 Testing

### Development Mode (No API Key)

If `RESEND_API_KEY` is not set, the app will:
- ✅ Still work normally
- ✅ Log email content to console
- ✅ Return success (so app doesn't break)

Check your terminal/console to see the email that would be sent.

### Production Mode (With API Key)

With `RESEND_API_KEY` set:
- ✅ Real emails will be sent
- ✅ Check Resend dashboard for delivery status
- ✅ Check recipient's inbox (and spam folder)

## 📝 Email Templates

The app includes HTML email templates for:
- **Participant Invitations** - Sent when inviting participants to seminars

Templates are in `src/lib/email.ts` and can be customized.

## 🔧 Troubleshooting

### Emails Not Sending

1. **Check API Key**: Make sure `RESEND_API_KEY` is set correctly
2. **Check Domain**: If using custom `EMAIL_FROM`, domain must be verified in Resend
3. **Check Logs**: Look at server console for error messages
4. **Check Resend Dashboard**: See delivery status and errors

### Emails Going to Spam

1. **Verify Domain**: Use a verified domain in `EMAIL_FROM`
2. **Add SPF/DKIM Records**: Resend provides these when you verify a domain
3. **Warm Up Domain**: Send a few test emails first

### Development Testing

For local development without real emails:
- Leave `RESEND_API_KEY` empty
- Check console logs for email content
- Use Resend's test mode or a service like Mailtrap

## 📚 Alternative Email Services

If you prefer a different email service, you can modify `src/lib/email.ts`:

- **SendGrid**: Replace Resend API calls with SendGrid SDK
- **AWS SES**: Use AWS SDK for email sending
- **Nodemailer**: Use SMTP with any email provider
- **Supabase Edge Functions**: Use Supabase's built-in email

## 🎯 Current Email Features

- ✅ Participant invitation emails (seminar applications)
- ✅ Confirmation links with unique tokens
- ✅ Beautiful HTML email templates
- ✅ Automatic email sending on invitation creation

---

**Need Help?** Check Resend documentation: [https://resend.com/docs](https://resend.com/docs)

