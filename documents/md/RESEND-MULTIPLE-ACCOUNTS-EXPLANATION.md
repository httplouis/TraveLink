# 📧 Resend Multiple Accounts - Pwede Ba?

## ❓ Tanong: Pwede ba mag-create ng multiple Resend accounts para sa different emails?

**Short Answer:** ✅ **Pwede technically**, pero ❌ **Hindi praktikal at hindi recommended**

---

## ✅ Option: Multiple Resend Accounts

### Paano:

1. **Create Account 1:**
   - Sign up sa Resend using `a22-34976@student.mseuf.edu.ph`
   - Get API key: `re_abc123...`
   - Can send to: `a22-34976@student.mseuf.edu.ph` only

2. **Create Account 2:**
   - Sign up sa Resend using `a22-33538@student.mseuf.edu.ph`
   - Get API key: `re_xyz789...`
   - Can send to: `a22-33538@student.mseuf.edu.ph` only

3. **Use in Code:**
   - Problem: Code can only use ONE `RESEND_API_KEY` at a time
   - Need to switch API keys manually OR
   - Update code to support multiple API keys (complicated!)

---

## ❌ Problems with Multiple Accounts:

### 1. **Code Limitation**
```typescript
// Current code only supports ONE API key:
const apiKey = process.env.RESEND_API_KEY; // Only one!

// To support multiple, need complex logic:
const apiKey = getApiKeyForRecipient(email); // Need to implement this
```

### 2. **Not Scalable**
- If you need 10 emails, need 10 accounts
- Need to manage 10 API keys
- Very complicated!

### 3. **Rate Limits**
- Each account has its own 3,000/month limit
- But still limited to one recipient per account

### 4. **Maintenance Nightmare**
- Need to update code for each new account
- Need to manage multiple API keys
- Hard to debug if something goes wrong

---

## ✅ BETTER SOLUTION: Verify Domain

### Instead of multiple accounts:

1. **Verify Domain Once:**
   - Verify `@student.mseuf.edu.ph` domain
   - Add DNS records in Cloudflare
   - Wait for verification

2. **Result:**
   - ✅ Can send to ANY email under `@student.mseuf.edu.ph`
   - ✅ Can send to `a22-34976@student.mseuf.edu.ph`
   - ✅ Can send to `a22-33538@student.mseuf.edu.ph`
   - ✅ Can send to `a22-34939@student.mseuf.edu.ph`
   - ✅ Can send to ANY student email!
   - ✅ Only need ONE API key
   - ✅ Simple and scalable

---

## 🎯 Recommendation

**DON'T use multiple accounts** - it's too complicated!

**DO verify the domain** - one-time setup, unlimited emails!

---

## 📝 If You Really Need Multiple Accounts (Not Recommended)

If you absolutely must use multiple accounts, you'd need to:

1. **Update `.env.local`:**
   ```bash
   RESEND_API_KEY_1=re_abc123...  # For a22-34976
   RESEND_API_KEY_2=re_xyz789...  # For a22-33538
   ```

2. **Update `src/lib/email.ts`:**
   ```typescript
   // Need to add logic to select API key based on recipient
   function getApiKeyForEmail(email: string): string {
     if (email.includes('a22-34976')) {
       return process.env.RESEND_API_KEY_1!;
     } else if (email.includes('a22-33538')) {
       return process.env.RESEND_API_KEY_2!;
     }
     return process.env.RESEND_API_KEY!; // Default
   }
   ```

3. **Update sendEmail function:**
   ```typescript
   const apiKey = getApiKeyForEmail(to);
   // Use this API key instead of single RESEND_API_KEY
   ```

**But again, this is NOT recommended!** Just verify the domain instead! 🎯

