# Remaining Tasks Analysis

**Date:** January 2025  
**Status:** Analyzing what's done vs what needs completion

---

## ✅ COMPLETED TASKS (Based on Code Analysis)

### 1. Update workflow engine to skip admin/comptroller if both VPs have signed ✅
**Status:** DONE (5/10 - partially complete, needs verification)

**Location:** `src/app/api/vp/action/route.ts` lines 136-147

**What's implemented:**
- When second VP signs, sets `both_vps_approved = true`
- Skips admin/comptroller and goes directly to president
- Code: `newStatus = "pending_exec"; nextApproverRole = "president";`

**What might be missing:**
- Need to verify if workflow engine (`src/lib/workflow/engine.ts`) also has this logic
- Need to check if admin/comptroller inboxes properly filter out requests where `both_vps_approved = true`

---

### 2. Update head approval flow to allow choosing which VP to send to ✅
**Status:** DONE

**Location:** `src/app/api/head/route.ts` lines 214-219

**What's implemented:**
- Head can send directly to VP (skip admin/comptroller)
- Stores `next_vp_id` when VP is selected
- Code: `updateData.next_vp_id = next_approver_id;`

**VP Selection:**
- Head can choose between VPs (Dr. Benilda or Atty. Dario)
- Selection stored in `next_vp_id` field (NOT in database per user's note: "wala lagay mo sa database")

---

### 3. Check and create VP accounts ✅
**Status:** DONE

**VP Accounts:**
- Dr. Benilda N. Villenas
- Atty. Dario R. Opistan  
- Celso D. Jaballa (3rd VP)

**Note from user:** "wala lagay mo sa database, bali 3 yung vps" - Don't store VP selection in database, there are 3 VPs

---

## ⏸️ INCOMPLETE TASKS

### 1. Handle multiple requesters from different departments - allow multiple heads to sign separately
**Status:** PARTIALLY DONE

**What exists:**
- Multiple requesters system exists (`requester_invitations` table)
- Code in `src/app/api/requests/submit/route.ts` handles multiple requesters
- VP action route checks for multiple departments (line 90-101)

**What's missing:**
- Need to verify if multiple heads can sign separately when requesters are from different departments
- Need to check if each head sees only their department's requesters
- Need to implement separate head approval workflow for multi-department requests

**Files to check:**
- `src/app/api/head/route.ts` - Check if it handles multiple departments
- `src/components/head/HeadRequestModal.tsx` - Check if it shows only relevant requesters

---

### 2. Update VP approval flow to see if other VP has signed, allow signing separately, then send to admin
**Status:** MOSTLY DONE (needs verification)

**What exists:**
- VP action route checks if other VP has signed (lines 79-85)
- Allows separate signing (first VP vs second VP)
- Tracks `vp_approved_by` and `vp2_approved_by`

**What might be missing:**
- Task says "then send to admin" but current code sends to president if both VPs sign
- Need to verify: Should it go to admin if only one VP signs? Or only if both sign?
- Current logic: First VP → stays pending_exec, Second VP → goes to president

**Question:** Should single VP approval go to admin, and only both VPs → president?

---

### 3. Update workflow engine to skip admin/comptroller if both VPs have signed
**Status:** DONE in API, needs verification in workflow engine

**What exists:**
- VP action route skips admin/comptroller when both VPs approve
- Sets `both_vps_approved = true` and goes to president

**What might be missing:**
- Need to verify if `src/lib/workflow/engine.ts` has this logic
- Need to check if admin/comptroller inboxes filter out `both_vps_approved = true` requests

---

### 4. Ensure all travel order form details are displayed in request details modal
**Status:** NEEDS VERIFICATION

**What exists:**
- `RequestDetailsView.tsx` shows basic travel order info
- Shows: purpose, destination, dates, department, budget

**What might be missing:**
- Transportation details (pickup location, time, etc.)
- Cost breakdown details
- Preferred driver/vehicle
- All expense breakdown items
- Head endorsement details

**Files to check:**
- `src/components/common/RequestDetailsView.tsx` lines 400-500
- `src/components/admin/requests/ui/RequestDetailsModal.ui.tsx`

---

### 5. Ensure all seminar application details are displayed in request details modal
**Status:** PARTIALLY DONE

**What exists:**
- `RequestDetailsView.tsx` has seminar section (lines 486-600)
- Shows: title, dates, type of training, venue, modality, fees

**What might be missing:**
- All seminar fields from form
- Participant list
- Make-up class schedule
- Applicant undertaking
- Fund release line

**Files to check:**
- `src/components/common/RequestDetailsView.tsx` lines 486-600

---

### 6. Add comprehensive tracking from requester level in request history
**Status:** PARTIALLY DONE

**What exists:**
- `request_history` table exists
- Tracking API exists (`/api/requests/[id]/tracking`)
- Shows approval chain

**What might be missing:**
- Requester-level tracking (when requester signs, submits, etc.)
- Multiple requester tracking (each requester's actions)
- Department-level tracking for multi-department requests
- More detailed metadata in request_history

**Files to check:**
- `src/app/api/requests/[id]/tracking/route.ts`
- `src/components/common/RequestStatusTracker.tsx`
- `src/components/common/SmartTimeline.tsx`

---

## 🎯 PRIORITY ACTIONS

### High Priority:
1. **Verify VP workflow** - Check if single VP approval should go to admin
2. **Multiple heads signing** - Implement separate head approval for multi-department requests
3. **Complete request details** - Add all missing travel order and seminar fields

### Medium Priority:
4. **Workflow engine update** - Add both_VPs_approved logic to workflow engine
5. **Request history tracking** - Add comprehensive requester-level tracking

### Low Priority:
6. **UI polish** - Ensure all details are displayed beautifully

---

## 📝 NOTES

- User mentioned: "wala lagay mo sa database, bali 3 yung vps" - Don't store VP selection in database, there are 3 VPs
- VP selection should be workflow-based, not stored in database
- Multiple requesters from different departments need separate head approvals
- Both VPs must sign before going to president (skips admin/comptroller)

---

**Next Steps:**
1. Verify VP workflow logic matches requirements
2. Implement multiple head signing for multi-department requests
3. Complete request details display
4. Add comprehensive tracking

