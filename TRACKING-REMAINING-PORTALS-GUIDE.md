# 📝 Quick Guide: Add Tracking to Remaining Portals

## ✅ Already Completed
- ✅ User Portal (Submissions)
- ✅ HR Portal (Inbox)
- ✅ Executive Portal (Inbox)

## 🔧 To Add Tracking To:

### **1. Head Portal - Inbox**
**File to update**: `src/components/head/inbox/InboxContainer.tsx` (or similar)

**Steps:**
```typescript
// 1. Add imports
import RequestStatusTracker from "@/components/common/RequestStatusTracker";
import TrackingModal from "@/components/common/TrackingModal";
import { Eye } from "lucide-react";

// 2. Add state
const [trackingRequest, setTrackingRequest] = useState<any | null>(null);
const [showTrackingModal, setShowTrackingModal] = useState(false);

// 3. In request card, add compact tracker:
<div className="mt-2">
  <RequestStatusTracker
    status={item.status}
    requesterIsHead={item.requester_is_head}
    hasBudget={item.has_budget}
    hasParentHead={item.has_parent_head}
    compact={true}
  />
</div>

// 4. Add Track button:
<button
  onClick={(e) => {
    e.stopPropagation();
    setTrackingRequest(item);
    setShowTrackingModal(true);
  }}
  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#7a0019] hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
>
  <Eye className="h-3.5 w-3.5" />
  Track
</button>

// 5. Add TrackingModal at end:
{trackingRequest && (
  <TrackingModal
    isOpen={showTrackingModal}
    onClose={() => {
      setShowTrackingModal(false);
      setTrackingRequest(null);
    }}
    requestId={trackingRequest.id}
  />
)}
```

---

### **2. Head Portal - History**
**File to update**: `src/components/head/history/HistoryView.tsx` (or similar)

**Same steps as above** - add tracker and track button to history cards

---

### **3. Admin Portal - Inbox**
**File to update**: `src/components/admin/inbox/InboxContainer.tsx` (or similar)

**Same steps** - add tracking to pending requests queue

---

### **4. Admin Portal - History**
**File to update**: `src/components/admin/history/HistoryView.tsx` (or similar)

**Same steps** - add tracking to processed requests

---

### **5. Comptroller Portal** (if exists)
**Files**: Comptroller inbox/history components

**Same pattern** - import components, add state, add UI elements

---

## 🎯 Standard Implementation Pattern

For **ANY** portal that displays requests:

### **Step 1: Imports**
```typescript
import RequestStatusTracker from "@/components/common/RequestStatusTracker";
import TrackingModal from "@/components/common/TrackingModal";
import { Eye } from "lucide-react";
```

### **Step 2: State**
```typescript
const [trackingRequest, setTrackingRequest] = useState<any | null>(null);
const [showTrackingModal, setShowTrackingModal] = useState(false);
```

### **Step 3: In Request Card JSX**
```typescript
{/* Compact tracker */}
<div className="mt-2">
  <RequestStatusTracker
    status={item.status}
    requesterIsHead={item.requester_is_head}
    hasBudget={item.has_budget}
    hasParentHead={item.has_parent_head}
    compact={true}
  />
</div>

{/* Track button */}
<button
  onClick={(e) => {
    e.stopPropagation();
    setTrackingRequest(item);
    setShowTrackingModal(true);
  }}
  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#7a0019] hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
>
  <Eye className="h-3.5 w-3.5" />
  Track
</button>
```

### **Step 4: Modal at Bottom**
```typescript
{trackingRequest && (
  <TrackingModal
    isOpen={showTrackingModal}
    onClose={() => {
      setShowTrackingModal(false);
      setTrackingRequest(null);
    }}
    requestId={trackingRequest.id}
  />
)}
```

---

## 🔍 Finding Portal Files

Use this command to find all portal components:
```bash
# Find all inbox/history components
find src/components -name "*Inbox*.tsx" -o -name "*History*.tsx"

# Or search for specific portals
find src/components/head -name "*.tsx"
find src/components/admin -name "*.tsx"
find src/components/comptroller -name "*.tsx"
```

---

## ✅ Checklist

For each portal, ensure:
- [ ] Import tracking components
- [ ] Add state for tracking modal
- [ ] Add compact tracker to cards
- [ ] Add "Track" button
- [ ] Add TrackingModal component
- [ ] Test: Click track button → modal opens
- [ ] Test: Modal shows approval timeline
- [ ] Test: Compact tracker shows correct stages

---

## 🎉 Done!

Once these are added to all portals, **EVERYONE** in the system will have complete visibility into request tracking from submission to approval!

The pattern is the same everywhere - just copy the implementation from User, HR, or Exec portals and apply it to the remaining ones.
