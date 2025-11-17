# 📧 Resend Two Accounts Setup (For Testing)

## 🎯 Quick Setup for 2 Accounts

Since you only need 2 accounts for testing, here's the simple setup:

---

## ✅ Step 1: Create Two Resend Accounts

### Account 1:
1. Sign up sa Resend using: `a22-34976@student.mseuf.edu.ph`
2. Go to **API Keys** section
3. Create API key
4. Copy the key (starts with `re_...`)
5. Save as: `RESEND_API_KEY_1`

### Account 2:
1. Sign up sa Resend using: `a22-33538@student.mseuf.edu.ph`
2. Go to **API Keys** section
3. Create API key
4. Copy the key (starts with `re_...`)
5. Save as: `RESEND_API_KEY_2`

---

## ✅ Step 2: Update `.env.local`

Add both API keys to your `.env.local`:

```bash
# Default API key (for other emails - optional)
RESEND_API_KEY=re_default_key_here

# Account 1 - for a22-34976@student.mseuf.edu.ph
RESEND_API_KEY_1=re_BzA9Y47y_5r42BxxaJW17b6vbxJUQxuC1

# Account 2 - for a22-33538@student.mseuf.edu.ph
RESEND_API_KEY_2=re_49ogyV4R_15vDjLYvS3jsomcXy2SHerCf
```

**Note:** The code has hardcoded fallbacks, so even if you don't set these in `.env.local`, it will still work! But it's better to set them for security.

---

## ✅ Step 3: Code Already Updated!

The code in `src/lib/email.ts` has been updated to automatically:
- Use `RESEND_API_KEY_1` when sending to `a22-34976@student.mseuf.edu.ph`
- Use `RESEND_API_KEY_2` when sending to `a22-33538@student.mseuf.edu.ph`
- Use default `RESEND_API_KEY` for other emails

**No additional code changes needed!** ✅

---

## 🧪 Testing

### Test Account 1:
- Send email to: `a22-34976@student.mseuf.edu.ph`
- Should use `RESEND_API_KEY_1`
- Check console logs: `[sendEmail] 🔑 Using API key 1 for a22-34976`

### Test Account 2:
- Send email to: `a22-33538@student.mseuf.edu.ph`
- Should use `RESEND_API_KEY_2`
- Check console logs: `[sendEmail] 🔑 Using API key 2 for a22-33538`

---

## ⚠️ Important Notes

1. **For Testing Only:** This setup is good for testing, but for production, verify the domain instead!

2. **Email Matching:** The code checks if the recipient email contains the pattern:
   - `a22-34976@student.mseuf.edu.ph` → uses `RESEND_API_KEY_1`
   - `a22-33538@student.mseuf.edu.ph` → uses `RESEND_API_KEY_2`

3. **Fallback:** If no specific key is found, it uses the default `RESEND_API_KEY`

4. **Adding More:** If you need more accounts later, just add more `RESEND_API_KEY_3`, `RESEND_API_KEY_4`, etc. and update the code logic

---

## 🎯 For Production

**Remember:** For production, it's better to:
- ✅ Verify the domain (`@student.mseuf.edu.ph`)
- ✅ Use one API key for all emails
- ✅ Simpler and more scalable

But for testing with 2 accounts, this setup works perfectly! 🚀

