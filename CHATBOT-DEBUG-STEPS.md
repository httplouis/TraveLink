# 🔧 Chatbot Debug Steps

**Current Issue:** API key not working  
**Let's fix it step by step!**

---

## ✅ Step 1: Verify .env.local

Open `.env.local` and make sure it has:

```
GEMINI_API_KEY=AIzaSyDdKYcqpK0SLyVRAvmCSGF_lDb3EP2YotA
```

**Important:**
- No quotes around the key
- No spaces before/after `=`
- Key starts with `AIza`

---

## ✅ Step 2: Restart Server

**Must restart after changing .env.local!**

```bash
# Stop server (Ctrl+C)
pnpm dev
```

---

## ✅ Step 3: Test API Directly

Once server is running, open this URL in browser:

```
http://localhost:3000/api/ai/test
```

### Expected Response (Success):
```json
{
  "success": true,
  "message": "Gemini API is working!",
  "apiKeyLength": 39,
  "testResponse": "Hello",
  "model": "gemini-pro"
}
```

### If You See Error:
```json
{
  "success": false,
  "error": "API key not valid..."
}
```

**Then:**
1. Check API key is correct
2. Go to https://aistudio.google.com/app/apikey
3. Make sure key is **enabled**
4. Try regenerating the key

---

## ✅ Step 4: Check Console Logs

When you test the chatbot, check browser console (F12) for:

### Good Signs:
```
✅ API key found, length: 39
🤖 Initializing Gemini AI with model: gemini-pro
```

### Bad Signs:
```
❌ GEMINI_API_KEY not found in environment variables
```

**If you see the bad sign:**
- .env.local not saved
- Server not restarted
- Wrong file name (should be `.env.local` not `.env`)

---

## ✅ Step 5: Test Chatbot

1. Go to: `http://localhost:3000/user/request`
2. Click floating chat button (bottom-right)
3. Send message: "Hello"
4. Should get AI response!

---

## 🐛 Common Issues & Fixes

### Issue 1: "API key not found"
**Fix:** 
- Check `.env.local` exists in root folder
- Restart server
- Check file is named exactly `.env.local` (with dot)

### Issue 2: "Model not found"
**Fix:**
- Already fixed in code (using `gemini-pro`)
- Just restart server

### Issue 3: "API key invalid"
**Fix:**
- Copy key again from Google AI Studio
- Make sure no extra spaces
- Try regenerating key

### Issue 4: Chatbot button doesn't appear
**Fix:**
- Make sure you're logged in as faculty/user
- Check you're on a user page (not admin)
- Clear browser cache

---

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] `.env.local` file exists in root folder
- [ ] `GEMINI_API_KEY=...` line is in `.env.local`
- [ ] API key starts with `AIza`
- [ ] No quotes around API key
- [ ] Server restarted after adding key
- [ ] Test endpoint works: `/api/ai/test`
- [ ] Console shows "API key found"
- [ ] Chatbot button appears on user pages
- [ ] Can send messages in chatbot

---

## 🚀 Quick Test Command

Test if API key is loaded:

```bash
# In terminal (Windows PowerShell)
$env:GEMINI_API_KEY = "AIzaSyDdKYcqpK0SLyVRAvmCSGF_lDb3EP2YotA"
node -e "console.log(process.env.GEMINI_API_KEY)"
```

Should print your API key.

---

## 📞 Still Not Working?

If after all these steps it still doesn't work:

1. **Check Google AI Studio:**
   - Go to: https://aistudio.google.com/app/apikey
   - Make sure API key is **enabled** (not disabled)
   - Check quota hasn't been exceeded

2. **Try regenerating API key:**
   - Delete old key
   - Create new key
   - Update `.env.local`
   - Restart server

3. **Check API permissions:**
   - Make sure "Generative Language API" is enabled
   - Some accounts need to enable it manually

---

## ✅ Success Criteria

You'll know it's working when:

1. `/api/ai/test` returns success
2. Console shows "API key found"
3. Chatbot opens without errors
4. AI responds to your messages
5. No 404 or 400 errors in console

---

**Current Status:** Waiting for you to:
1. Add API key to `.env.local`
2. Restart server
3. Test `/api/ai/test` endpoint

Let me know what you see! 🚀
