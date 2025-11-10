# 🤖 Travie - AI Knowledge Base

**How to Train Travie, the AI Chatbot**

This file contains FACTS about TraviLink that the AI uses to answer questions.  
**Edit this file to update AI knowledge!**

---

## 📝 How This Works:

The AI reads the **System Prompt** in `src/lib/ai/gemini-service.ts`.  
Update that prompt based on information here to improve AI accuracy!

---

## ✅ ACCURATE SYSTEM INFORMATION

### Request Submission Process (Faculty)

**Step 1: Create New Request**
- Click **"New Request"** button on user dashboard
- Opens request form

**Step 2: Fill in Form Fields**
- **Request Type:** Radio buttons
  - ✅ Travel Order (for official travel)
  - ✅ Seminar/Training (for seminars)
- **Title:** Text input (name of trip/event)
- **Purpose:** Textarea (why need transport)
- **Destination:** Text input (where going)
- **Travel Start Date:** Date picker
- **Travel End Date:** Date picker
- **Participants:** Add participant button (name, position, etc.)
- **Budget Section:**
  - Has Budget? Checkbox
  - Total Budget: Number input
  - Expense Breakdown: Add expense items
- **Vehicle Need:**
  - Need Vehicle? Checkbox
  - Vehicle Type: Dropdown (Van, Bus, Car, Motorcycle)

**Step 3: Submit**
- Click **"Submit Request"** button
- Request goes to approval workflow

---

### Approval Workflow

**Standard process (with budget):**
1. **Department Head** - Reviews and approves/rejects request
2. **Admin** - Assigns vehicle and driver if needed
3. **Comptroller** - Approves budget (ONLY if request has budget items)
4. **HR** - Reviews for compliance
5. **Executive** - Final approval

**Special case - Owned vehicle + No budget:**
1. **Department Head** - Reviews and approves/rejects
2. **Admin** - Processes (no vehicle assignment needed)
3. **HR** - Reviews for compliance (SKIPS Comptroller since no budget)
4. **Executive** - Final approval

**Note:** Comptroller is a SEPARATE role from Admin. Comptroller only reviews requests with budget concerns.

**Automatic routing:** The system automatically routes the request to the appropriate approvers based on the request details.

**OR:**
- **Rejected** - At any stage, can be rejected with reason

---

### What Faculty Can See/Do

**Dashboard:**
- View their submitted requests
- See request status
- Create new requests

**Request Page:**
- Submit new transport requests
- View submission history table
- Check status of each request

**Submissions Page:**
- Detailed view of all their requests
- Status tracking
- View rejection reasons if rejected

**Feedback Page:**
- View feedback from past requests
- Rate their experience

**Drivers/Vehicles Pages:**
- View available drivers (read-only)
- View available vehicles (read-only)
- Cannot assign themselves

---

### What Faculty CANNOT Do

❌ Edit submitted requests (must create new one)  
❌ Delete submitted requests  
❌ Assign vehicles/drivers to requests (admin only)  
❌ Approve their own requests  
❌ See other faculty's requests  

---

### Common User Questions & Correct Answers

**Q: "How do I submit a travel request?"**  
A: Click "New Request", fill in the form with your trip details (type, title, purpose, destination, dates, participants), and click Submit. Your request will go through the approval workflow automatically.

**Q: "Where do I choose Travel Order?"**  
A: When you create a new request, the **first field** is "Request Type" where you choose between "Travel Order" or "Seminar/Training".

**Q: "How do I track my request?"**  
A: Go to "Submissions" page to see all your requests and their current status (pending, approved, or rejected).

**Q: "Can I edit my submitted request?"**  
A: No, once submitted, requests cannot be edited. If you need changes, create a new request or contact your admin.

**Q: "Who assigns the vehicle?"**  
A: The admin assigns vehicles and drivers after your department head approves your request.

**Q: "How long does approval take?"**  
A: It depends on each approver's response time. You can track the status in your Submissions page.

---

## 🚫 THINGS AI SHOULD NEVER SAY

❌ "Choose Travel Order from the dropdown" (it's a radio button in Request Type field)  
❌ "Edit your submitted request" (cannot edit after submit)  
❌ "You can assign your own vehicle" (admin only)  
❌ "Delete your request" (cannot delete after submit)  
❌ "See other people's requests" (privacy protected)  
❌ Repeat the same generic answer twice - answer questions DIRECTLY and SPECIFICALLY  

---

## 🎯 HOW TO UPDATE THE AI

### Step 1: Edit This File
Add/update information in the sections above

### Step 2: Update System Prompt
Open: `src/lib/ai/gemini-service.ts`  
Line: ~8 (`const SYSTEM_PROMPT`)

Update the prompt with new information from this knowledge base.

### Step 3: Restart Server
```bash
pnpm dev
```

### Step 4: Test
Ask the AI questions to verify it gives correct answers!

---

## 💡 FUTURE IMPROVEMENTS

### Option 1: RAG (Retrieval Augmented Generation)
- Create a vector database of TraviLink documentation
- AI searches relevant docs before answering
- More accurate, always up-to-date

### Option 2: Function Calling
- Give AI access to actual system data
- AI can check real request status, available vehicles, etc.
- More dynamic responses

### Option 3: Context Injection
- Detect which page user is on
- Include page-specific info in prompt
- Example: "User is on Request page, these fields are visible: ..."

### Option 4: Knowledge Base API
- Store FAQs and docs in database
- AI searches database before answering
- Easy to update without code changes

---

## 📋 TESTING CHECKLIST

Test these questions with the AI:

- [ ] "How do I submit a request?" - Should give accurate steps
- [ ] "Where is the Travel Order dropdown?" - Should clarify it's a radio button in Request Type
- [ ] "Can I edit my request?" - Should say NO, create new one
- [ ] "Who assigns vehicles?" - Should say Admin
- [ ] "What's the approval process?" - Should list: Head → Admin → Comptroller → HR → Exec
- [ ] "Can I see other people's requests?" - Should say NO

If AI gets any wrong, update the SYSTEM_PROMPT!

---

## 🔧 CURRENT AI CONFIGURATION

**Model:** Gemini 2.5 Flash Lite  
**API:** Google Generative Language API (v1beta)  
**Context Window:** ~2048 tokens  
**Temperature:** 0.9 (creative but factual)  

**Prompt Location:**  
`src/lib/ai/gemini-service.ts` line 8

**API Key:**  
Stored in `.env.local` as `GEMINI_API_KEY`

---

**Last Updated:** November 9, 2025  
**Updated By:** AI Integration Team

Keep this file updated as the system evolves!
