# Super Prompt: Fix Head to Admin Sending with Searchable Approver Selection

## Problem
When a head approves a request and tries to send it to admin, the approver selection modal shows "No users found" - there are no admin options to choose from.

## Requirements
1. **Automatic Detection**: When head approves, automatically show admin as the next approver option
2. **Searchable List**: Show all admins in a searchable list (like the department dropdown)
3. **Smart Defaults**: If only one admin exists, auto-select them (but still allow change)
4. **Parent Head Option**: If department has a parent, also show parent head as option
5. **Return to Requester**: Always allow returning to requester with reason
6. **Wow Factor**: Make it smooth, fast, and intuitive

## Implementation Plan

### 1. Fix API Endpoint Usage
- Head modal currently calls `/api/approvers?role=admin` (wrong endpoint)
- Should call `/api/approvers/list?role=admin` (correct endpoint)
- This endpoint returns all admins with full profile info

### 2. Enhance ApproverSelectionModal
- Already has search functionality ✅
- Already shows profile pictures ✅
- Need to ensure it displays properly when admins are fetched

### 3. Auto-fetch Admins
- When head clicks "Approve", automatically fetch admins
- Show loading state while fetching
- Display all admins in searchable list
- If no admins found, show helpful message but still allow return to requester

### 4. Smart Defaults
- If only 1 admin: Pre-select them (but allow change)
- If multiple admins: Show all, let head choose
- Always show "Return to Requester" option first

### 5. Parent Head Detection
- Check if request's department has a parent_department_id
- If yes, fetch parent department head
- Show parent head as an option (before admin options)

### 6. Real-time Updates
- Ensure approver list updates if admins are added/removed
- Use Supabase Realtime if needed for live updates

## Files to Modify

1. `src/components/head/HeadRequestModal.tsx`
   - Fix API endpoint from `/api/approvers` to `/api/approvers/list`
   - Add parent head fetching logic
   - Improve error handling
   - Add loading state

2. `src/components/common/ApproverSelectionModal.tsx`
   - Already has search ✅
   - Ensure it handles empty states gracefully
   - Add auto-select for single admin option

3. `src/app/api/approvers/list/route.ts`
   - Verify it returns admins correctly
   - Ensure it includes all necessary fields (name, email, profile_picture, etc.)

4. `src/app/api/departments/route.ts`
   - Verify it returns parent_department_id
   - May need to add endpoint to fetch single department with parent info

## Testing Checklist
- [ ] Head can see all admins when approving
- [ ] Search works in approver selection modal
- [ ] Parent head appears if department has parent
- [ ] Return to requester works with reason
- [ ] Single admin auto-selects (but can be changed)
- [ ] Multiple admins all appear in list
- [ ] Loading state shows while fetching
- [ ] Error handling works if API fails
- [ ] Real-time updates if admin list changes

## Expected Behavior

1. Head clicks "Approve" → Signature pad appears
2. Head signs and adds comments → Clicks "Approve" button
3. Modal shows:
   - "Return to Requester" option (with reason dropdown)
   - Search bar (if more than 3 options)
   - List of all admins (with profile pictures, names, emails)
   - Parent head (if applicable)
4. Head can:
   - Search for specific admin
   - Click to select admin
   - Return to requester with reason
5. After selection → Request sent to chosen approver

## Wow Factor Features
- Smooth animations
- Profile pictures for visual recognition
- Search highlights matching text
- Keyboard navigation (arrow keys, enter)
- Auto-focus on search when modal opens
- Loading skeleton while fetching
- Success animation after selection

