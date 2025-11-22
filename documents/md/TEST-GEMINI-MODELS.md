# 🧪 Test Gemini Models - Quick Fix

**Issue:** Model names keep changing/not found  
**Solution:** Test which model works with your API key

---

## 🚀 Quick Test Script

Create a test file to see which models work:

### Create: `test-gemini.js` (in root folder)

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Replace with your actual API key
const API_KEY = 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-pro', 
  'gemini-pro',
  'gemini-1.0-pro',
  'models/gemini-1.5-flash',
  'models/gemini-pro',
];

async function testModels() {
  console.log('🧪 Testing Gemini models...\n');
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} WORKS!`);
      console.log(`   Response: ${text.substring(0, 50)}...\n`);
    } catch (error) {
      console.log(`❌ ${modelName} FAILED`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

testModels();
```

### Run the test:
```bash
node test-gemini.js
```

This will show you which model name works!

---

## 🎯 Alternative: Use Official Model List API

The code I added will automatically try multiple models and use the first one that works!

The fallback order:
1. `gemini-1.5-flash` (newest)
2. `gemini-1.5-pro` (more powerful)
3. `gemini-pro` (older but stable)
4. `models/gemini-1.5-flash` (with prefix)
5. `models/gemini-pro` (with prefix)

---

## ✅ What I Fixed:

Updated `src/lib/ai/gemini-service.ts` to:
- Try multiple model names automatically
- Use the first one that works
- Log which model is being used
- Better error messages

---

## 🔄 Next Steps:

1. **Save all files** ✅
2. **Restart server:**
   ```bash
   pnpm dev
   ```
3. **Check console** - Should see: `✅ Using model: [model-name]`
4. **Test chatbot** - Should work now!

---

## 📊 Expected Console Output:

```
❌ Model gemini-1.5-flash not available, trying next...
✅ Using model: gemini-pro
```

Or whichever model works first!

---

**The code now automatically finds a working model!** Just restart and test! 🚀
