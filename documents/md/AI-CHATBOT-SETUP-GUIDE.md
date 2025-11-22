# 🤖 AI Chatbot Setup Guide - Google Gemini

**Feature:** AI Assistant Chatbot for Faculty Users  
**Powered by:** Google Gemini API (Free Tier)  
**Status:** ✅ Ready to Test

---

## 📦 What Was Created

### 1. **AI Service Layer**
- `src/lib/ai/gemini-service.ts` - Google Gemini integration
- Handles chat conversations with context
- Includes TraviLink-specific system prompt
- Intent detection for user actions

### 2. **API Endpoint**
- `src/app/api/ai/chat/route.ts` - Chat API
- POST: Send messages to AI
- GET: Get quick suggestions

### 3. **UI Component**
- `src/components/ai/ChatbotWidget.tsx` - Beautiful floating chatbot
- Modern gradient design
- Conversation history
- Quick suggestions
- Loading states

### 4. **Integration**
- Added to `src/app/(protected)/user/layout.tsx`
- Available on all faculty/user pages
- Floating button in bottom-right corner

---

## 🔑 Setup Instructions

### Step 1: Get Free Google Gemini API Key

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Get API Key"
   - Click "Create API Key"
   - Copy the key (starts with `AIza...`)

3. **Free Tier Limits**
   - ✅ 60 requests per minute
   - ✅ 1,500 requests per day
   - ✅ 1 million tokens per month
   - ✅ No credit card required!

### Step 2: Add API Key to Environment

1. **Open `.env.local` file** in the root directory

2. **Add this line:**
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Example:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
pnpm dev
```

---

## 🚀 How to Use

### For Users (Faculty):

1. **Login as faculty user**
2. **Look for the floating chat button** (bottom-right corner)
   - Blue-purple gradient button
   - Has a sparkle icon
3. **Click to open chatbot**
4. **Start chatting!**

### Example Questions:
- "How do I submit a travel request?"
- "What vehicles are available?"
- "How long does approval take?"
- "Can I check my request status?"
- "I need a van for 15 people to Manila next week"

---

## 🎨 Features

### ✅ What the Chatbot Can Do:

1. **Answer Questions**
   - Explain how to use TraviLink
   - Guide through request submission
   - Explain approval workflow
   - Provide system information

2. **Provide Guidance**
   - Help fill out request forms
   - Suggest what information is needed
   - Explain different request types

3. **Quick Suggestions**
   - Pre-made common questions
   - One-click to ask

4. **Conversation Memory**
   - Remembers last 5 messages
   - Context-aware responses

### 🎯 What It Cannot Do (Yet):

- Cannot directly create requests (just guides)
- Cannot access user's actual data
- Cannot check real-time request status
- Cannot assign vehicles/drivers

**Future Enhancement:** Connect to database to provide personalized info!

---

## 🧪 Testing Checklist

### Test 1: Basic Chat
- [ ] Click floating chat button
- [ ] See welcome message
- [ ] Type "Hello" and send
- [ ] Get AI response

### Test 2: Quick Suggestions
- [ ] Click a quick suggestion button
- [ ] Get relevant answer

### Test 3: Request Help
- [ ] Ask "How do I submit a request?"
- [ ] Get step-by-step guide

### Test 4: Conversation Context
- [ ] Ask "What is TraviLink?"
- [ ] Then ask "How do I use it?"
- [ ] AI should remember context

### Test 5: Multiple Messages
- [ ] Send 5+ messages
- [ ] Check conversation history works
- [ ] Auto-scroll to bottom

---

## 🎨 UI Features

### Design Elements:
- ✅ Gradient blue-purple theme
- ✅ Floating button with sparkle animation
- ✅ Smooth animations
- ✅ Message timestamps
- ✅ Loading indicator
- ✅ Responsive design
- ✅ Auto-scroll to latest message

### Accessibility:
- ✅ Keyboard support (Enter to send)
- ✅ ARIA labels
- ✅ Clear visual feedback
- ✅ Disabled states

---

## 🔧 Customization Options

### Change AI Personality

Edit `src/lib/ai/gemini-service.ts`:

```typescript
const SYSTEM_PROMPT = `You are TraviLink AI Assistant...
// Modify this to change how AI responds
`;
```

### Change UI Colors

Edit `src/components/ai/ChatbotWidget.tsx`:

```typescript
// Change gradient colors
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Change to your school colors!
className="bg-gradient-to-r from-green-600 to-yellow-600"
```

### Add More Quick Suggestions

Edit `src/lib/ai/gemini-service.ts`:

```typescript
export function getQuickSuggestions(): string[] {
  return [
    'How do I submit a travel request?',
    'Your new question here',
    // Add more...
  ];
}
```

---

## 💰 Cost Tracking

### Free Tier Usage:
- **60 requests/minute** = ~3,600 requests/hour
- **1,500 requests/day** = enough for 100+ users chatting
- **1 million tokens/month** = ~750,000 words

### Typical Usage:
- Average chat: 5-10 messages = 10-20 API calls
- 100 users/day × 10 messages = 1,000 requests/day
- **Well within free tier!** ✅

### If You Exceed Free Tier:
- Google will notify you
- You can upgrade to paid tier
- Or implement rate limiting

---

## 🐛 Troubleshooting

### Problem: "AI service is not configured"
**Solution:** 
- Check `.env.local` has `GEMINI_API_KEY`
- Restart dev server
- Verify API key is correct

### Problem: Chat button doesn't appear
**Solution:**
- Make sure you're logged in as faculty/user
- Check browser console for errors
- Verify you're on a user page (not admin)

### Problem: AI responses are slow
**Solution:**
- Normal for free tier (2-5 seconds)
- Consider upgrading to paid tier for faster responses
- Or use GPT-3.5-turbo (faster but costs money)

### Problem: "Failed to get response"
**Solution:**
- Check internet connection
- Verify API key is valid
- Check Gemini API status: https://status.cloud.google.com/

---

## 📊 Analytics Ideas (Future)

Track chatbot usage:
- Number of conversations
- Most asked questions
- User satisfaction ratings
- Common issues/pain points

Add to database:
```sql
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  messages JSONB,
  created_at TIMESTAMPTZ
);
```

---

## 🚀 Next Steps / Enhancements

### Phase 1 (Current): ✅ DONE
- [x] Basic chatbot working
- [x] Google Gemini integration
- [x] Beautiful UI
- [x] Quick suggestions

### Phase 2 (Next):
- [ ] Connect to user's actual data
- [ ] Show real request status
- [ ] Personalized responses
- [ ] "Create request" button in chat

### Phase 3 (Advanced):
- [ ] Voice input
- [ ] Multi-language support
- [ ] Smart notifications
- [ ] Analytics dashboard

---

## 📝 Files Created

```
src/
├── lib/
│   └── ai/
│       └── gemini-service.ts          ✅ AI service
├── app/
│   └── api/
│       └── ai/
│           └── chat/
│               └── route.ts           ✅ API endpoint
├── components/
│   └── ai/
│       └── ChatbotWidget.tsx          ✅ UI component
└── app/
    └── (protected)/
        └── user/
            └── layout.tsx             ✅ Integrated
```

---

## 🎉 Success Criteria

Your chatbot is working if:
- ✅ Floating button appears on user pages
- ✅ Clicking opens chat window
- ✅ Can send messages and get AI responses
- ✅ Quick suggestions work
- ✅ Conversation history maintained
- ✅ No console errors

---

## 🆘 Need Help?

### Common Questions:

**Q: Is this really free?**  
A: Yes! Google Gemini free tier is generous enough for a capstone project.

**Q: Can I use this in production?**  
A: Yes, but monitor usage. Consider upgrading if you get many users.

**Q: Can I switch to OpenAI later?**  
A: Yes! Just change the `gemini-service.ts` to use OpenAI API instead.

**Q: Will this work offline?**  
A: No, it needs internet to call Google's API. For offline, use Ollama.

---

## 🎯 Quick Test Command

```bash
# Test the API directly
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what is TraviLink?"}'

# Should return AI response!
```

---

## ✅ Deployment Checklist

Before deploying to production:
- [ ] Add `GEMINI_API_KEY` to Vercel/hosting environment variables
- [ ] Test on production URL
- [ ] Monitor API usage
- [ ] Set up error tracking
- [ ] Add rate limiting (optional)

---

**Status:** 🎉 **READY TO TEST!**

**Next:** Get your Gemini API key and start chatting! 🚀

---

**Created:** November 9, 2025  
**Developer:** TraviLink Team  
**AI Model:** Google Gemini 1.5 Flash (Free)
