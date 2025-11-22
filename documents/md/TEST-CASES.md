# TraviLink Test Cases

## Overview
This document contains comprehensive test cases for double and triple checking all functionality in the TraviLink system.

---

## 1. Request Submission Tests

### 1.1 Basic Travel Order Submission
**Test Case ID:** TC-001  
**Description:** Submit a basic travel order request as a faculty member  
**Steps:**
1. Login as faculty user
2. Navigate to "New Request" → "Travel Order"
3. Fill in all required fields:
   - Requesting Person: [Faculty Name]
   - Destination: "Manila"
   - Purpose: "Conference attendance"
   - Travel dates: Future dates
   - Add expense breakdown (optional)
4. Sign the request
5. Submit

**Expected Results:**
- ✅ Request created with status `pending_head`
- ✅ Request number generated (format: TO-YYYY-XXX)
- ✅ Notification sent to department head
- ✅ Request appears in user's submissions
- ✅ Request appears in department head's inbox

**Validation Points:**
- [ ] Request number format is correct
- [ ] Status is `pending_head` (not `pending_admin`)
- [ ] Department head receives notification
- [ ] Request visible in correct inboxes

---

### 1.2 Head Requester Submission
**Test Case ID:** TC-002  
**Description:** Submit a travel order as a department head  
**Steps:**
1. Login as department head
2. Navigate to "New Request" → "Travel Order"
3. Fill in all required fields
4. Sign and submit

**Expected Results:**
- ✅ Request created with status `pending_admin` (skips head approval)
- ✅ Request goes directly to Admin inbox
- ✅ No head approval step required

**Validation Points:**
- [ ] Status is `pending_admin` (not `pending_head`)
- [ ] Request appears in Admin inbox
- [ ] Head approval step is skipped

---

### 1.3 Representative Submission
**Test Case ID:** TC-003  
**Description:** Submit a request on behalf of another person  
**Steps:**
1. Login as faculty user
2. Navigate to "New Request" → "Travel Order"
3. Enter a different person's name in "Requesting Person" field
4. Fill in all required fields
5. Sign as submitter
6. Submit

**Expected Results:**
- ✅ Request created with status `pending_requester_signature`
- ✅ Email sent to requesting person
- ✅ Notification sent to requesting person
- ✅ Request appears in requesting person's inbox for signature
- ✅ After signature, status changes to `pending_head`

**Validation Points:**
- [ ] Status is `pending_requester_signature`
- [ ] Email sent to requesting person
- [ ] Request appears in requesting person's inbox
- [ ] Requesting person can sign the request
- [ ] After signature, status becomes `pending_head`

---

### 1.4 Multiple Requesters (Director + Faculty)
**Test Case ID:** TC-004  
**Description:** Submit a request with multiple requesters including Director and Faculty  
**Steps:**
1. Login as Director
2. Navigate to "New Request" → "Travel Order"
3. Add multiple requesters:
   - Primary: Director
   - Additional: Faculty member
4. Fill in all required fields
5. Submit

**Expected Results:**
- ✅ Request created with status `pending_head` (Faculty needs Dean signature)
- ✅ Request goes to Faculty's department head first
- ✅ Even though Director is primary requester, Faculty's Dean must approve first
- ✅ After Dean approval, request proceeds normally

**Validation Points:**
- [ ] Status is `pending_head` (not `pending_admin`)
- [ ] Request goes to Faculty's department head (not Director's)
- [ ] Faculty's Dean receives notification
- [ ] After Dean approval, request continues workflow

---

### 1.5 Seminar Application Submission
**Test Case ID:** TC-005  
**Description:** Submit a seminar application request  
**Steps:**
1. Login as faculty user
2. Navigate to "New Request" → "Seminar Application"
3. Fill in all required fields:
   - Seminar title
   - Training category
   - Dates
   - Venue
   - Modality
   - Cost breakdown
4. Sign and submit

**Expected Results:**
- ✅ Request created with status `pending_head`
- ✅ Request number generated (format: SEM-YYYY-XXX)
- ✅ Seminar data saved correctly
- ✅ Request appears in department head's inbox

**Validation Points:**
- [ ] Request number format is correct (SEM- prefix)
- [ ] Seminar data is saved in `seminar_data` JSONB field
- [ ] Status is `pending_head`
- [ ] Request visible in head's inbox

---

### 1.6 Request with Attachments
**Test Case ID:** TC-006  
**Description:** Submit a request with file attachments  
**Steps:**
1. Login as faculty user
2. Navigate to "New Request" → "Travel Order"
3. Fill in required fields
4. Upload attachment files (PDF/image)
5. Submit

**Expected Results:**
- ✅ Files uploaded to Supabase storage
- ✅ Attachment metadata saved in `attachments` JSONB field
- ✅ Files accessible via download links
- ✅ Attachments visible in request details

**Validation Points:**
- [ ] Files uploaded successfully
- [ ] Attachment metadata saved correctly
- [ ] Files can be downloaded
- [ ] Attachments visible in RequestDetailsView

---

## 2. Approval Workflow Tests

### 2.1 Head Approval (Faculty Request)
**Test Case ID:** TC-007  
**Description:** Department head approves a faculty request  
**Steps:**
1. Login as department head
2. Navigate to inbox
3. Open pending request from faculty
4. Review request details
5. Approve with signature

**Expected Results:**
- ✅ Request status changes to `pending_admin`
- ✅ Head signature saved
- ✅ Request appears in Admin inbox
- ✅ Notification sent to Admin
- ✅ Request history logged

**Validation Points:**
- [ ] Status updated to `pending_admin`
- [ ] Head signature saved
- [ ] Request appears in Admin inbox
- [ ] Audit log created

---

### 2.2 Admin Processing (No Budget)
**Test Case ID:** TC-008  
**Description:** Admin processes request with no budget  
**Steps:**
1. Login as Admin
2. Open pending request (no budget)
3. Assign vehicle/driver (if needed)
4. Process request

**Expected Results:**
- ✅ Request status changes to `pending_hr` (skips Comptroller)
- ✅ Request appears in HR inbox
- ✅ Comptroller step is skipped

**Validation Points:**
- [ ] Status is `pending_hr` (not `pending_comptroller`)
- [ ] Request appears in HR inbox
- [ ] Comptroller inbox does not show request

---

### 2.3 Admin Processing (With Budget)
**Test Case ID:** TC-009  
**Description:** Admin processes request with budget  
**Steps:**
1. Login as Admin
2. Open pending request (with budget)
3. Assign vehicle/driver
4. Process request

**Expected Results:**
- ✅ Request status changes to `pending_comptroller`
- ✅ Request appears in Comptroller inbox
- ✅ Comptroller step is included

**Validation Points:**
- [ ] Status is `pending_comptroller`
- [ ] Request appears in Comptroller inbox
- [ ] Budget information visible

---

### 2.4 Comptroller Approval
**Test Case ID:** TC-010  
**Description:** Comptroller reviews and approves budget  
**Steps:**
1. Login as Comptroller
2. Open pending request
3. Review budget
4. Approve (or edit budget)
5. Send to HR

**Expected Results:**
- ✅ Request status changes to `pending_hr`
- ✅ Comptroller signature saved
- ✅ Request appears in HR inbox
- ✅ Budget edits (if any) saved

**Validation Points:**
- [ ] Status updated to `pending_hr`
- [ ] Comptroller signature saved
- [ ] Budget edits (if any) reflected
- [ ] Request appears in HR inbox

---

### 2.5 HR Approval (Faculty + Head)
**Test Case ID:** TC-011  
**Description:** HR approves faculty request with head included  
**Steps:**
1. Login as HR
2. Open pending request (faculty + head included)
3. Review request
4. Approve

**Expected Results:**
- ✅ Request status changes to `pending_exec`
- ✅ Request routed to VP (not President)
- ✅ HR signature saved
- ✅ Request appears in VP inbox

**Validation Points:**
- [ ] Status is `pending_exec`
- [ ] `exec_level` is `vp` (not `president`)
- [ ] Request appears in VP inbox
- [ ] HR signature saved

---

### 2.6 HR Approval (Head Requester)
**Test Case ID:** TC-012  
**Description:** HR approves request from department head  
**Steps:**
1. Login as HR
2. Open pending request (head requester)
3. Approve

**Expected Results:**
- ✅ Request status changes to `pending_exec`
- ✅ Request routed to President (not VP)
- ✅ Request appears in President inbox

**Validation Points:**
- [ ] Status is `pending_exec`
- [ ] `exec_level` is `president`
- [ ] Request appears in President inbox
- [ ] VP inbox does not show request

---

### 2.7 HR Approval (Faculty with Budget Threshold)
**Test Case ID:** TC-013  
**Description:** HR approves faculty request with budget >= threshold  
**Steps:**
1. Login as HR
2. Open pending request (faculty, budget >= ₱5,000)
3. Approve

**Expected Results:**
- ✅ Request routed to President (not VP)
- ✅ Budget threshold check works correctly
- ✅ Request appears in President inbox

**Validation Points:**
- [ ] Budget threshold check works
- [ ] Request routed to President
- [ ] Threshold value from `system_config` table

---

### 2.8 VP Approval
**Test Case ID:** TC-014  
**Description:** VP approves request  
**Steps:**
1. Login as VP
2. Open pending request
3. Approve with signature

**Expected Results:**
- ✅ VP signature saved
- ✅ `both_vps_approved` set to `true` (one VP is sufficient)
- ✅ Request routed based on requester type:
   - Head/Director/Dean → President
   - Faculty (budget < threshold) → Approved
   - Faculty (budget >= threshold) → President

**Validation Points:**
- [ ] VP signature saved
- [ ] `both_vps_approved` is `true`
- [ ] Routing logic works correctly
- [ ] SMS sent to driver (if approved and driver assigned)

---

### 2.9 President Approval
**Test Case ID:** TC-015  
**Description:** President approves request  
**Steps:**
1. Login as President
2. Open pending request
3. Approve with signature

**Expected Results:**
- ✅ Request status changes to `approved`
- ✅ President signature saved
- ✅ `final_approved_at` timestamp set
- ✅ SMS sent to driver (if assigned)
- ✅ Request appears in requester's submissions as approved

**Validation Points:**
- [ ] Status is `approved`
- [ ] President signature saved
- [ ] SMS sent to driver
- [ ] Request visible in requester's submissions

---

## 3. Multiple Requesters Tests

### 3.1 Requester Invitation
**Test Case ID:** TC-016  
**Description:** Invite additional requester to travel order  
**Steps:**
1. Create travel order
2. Add requester via email
3. Send invitation

**Expected Results:**
- ✅ Invitation created in `requester_invitations` table
- ✅ Email sent to requester
- ✅ Invitation link generated
- ✅ Token expires in 7 days

**Validation Points:**
- [ ] Invitation record created
- [ ] Email sent successfully
- [ ] Invitation link works
- [ ] Token expiration set correctly

---

### 3.2 Requester Confirmation
**Test Case ID:** TC-017  
**Description:** Requester confirms invitation  
**Steps:**
1. Click invitation link
2. Review request details
3. Sign request
4. Confirm participation

**Expected Results:**
- ✅ Invitation status changes to `confirmed`
- ✅ Requester signature saved
- ✅ Requester added to request
- ✅ Request proceeds with all requesters

**Validation Points:**
- [ ] Invitation status updated
- [ ] Signature saved
- [ ] Requester visible in request
- [ ] Request workflow continues

---

### 3.3 Mixed Requesters Routing
**Test Case ID:** TC-018  
**Description:** Request with Director + Faculty requesters  
**Steps:**
1. Create request with Director (primary) + Faculty (additional)
2. Submit request
3. Verify routing

**Expected Results:**
- ✅ Request goes to Faculty's Dean first (not Director's)
- ✅ Faculty's Dean must approve
- ✅ After Dean approval, request continues normally

**Validation Points:**
- [ ] Initial status is `pending_head`
- [ ] Request goes to Faculty's department head
- [ ] Director's approval not required at head level
- [ ] Workflow continues after Dean approval

---

## 4. PDF Generation Tests

### 4.1 Travel Order PDF
**Test Case ID:** TC-019  
**Description:** Generate PDF for approved travel order  
**Steps:**
1. Navigate to approved request
2. Click "Download PDF"
3. Verify PDF content

**Expected Results:**
- ✅ PDF generated successfully
- ✅ All request details included
- ✅ All signatures placed correctly
- ✅ File name format: `TO-YYYY-XXX-REQUESTER-DRIVER.pdf`
- ✅ Uses Travel Order template

**Validation Points:**
- [ ] PDF generates without errors
- [ ] All fields populated correctly
- [ ] Signatures visible and positioned correctly
- [ ] File name format is correct
- [ ] Template is correct (Travel Order)

---

### 4.2 Seminar Application PDF
**Test Case ID:** TC-020  
**Description:** Generate PDF for approved seminar application  
**Steps:**
1. Navigate to approved seminar request
2. Click "Download PDF"
3. Verify PDF content

**Expected Results:**
- ✅ PDF generated successfully
- ✅ Seminar data included
- ✅ All signatures placed correctly
- ✅ Uses Seminar Application template
- ✅ Signature coordinates correct

**Validation Points:**
- [ ] PDF generates without errors
- [ ] Seminar data visible
- [ ] Signatures positioned correctly
- [ ] Template is correct (Seminar Application)
- [ ] Coordinates match template

---

### 4.3 Multi-Page PDF (Many Participants)
**Test Case ID:** TC-021  
**Description:** Generate PDF with many participants (>8)  
**Steps:**
1. Create request with 10+ participants
2. Approve request
3. Generate PDF

**Expected Results:**
- ✅ PDF has multiple pages
- ✅ Participants distributed across pages
- ✅ All participant signatures included
- ✅ Page headers show page numbers

**Validation Points:**
- [ ] Multiple pages created
- [ ] Participants distributed correctly
- [ ] All signatures visible
- [ ] Page numbering correct

---

## 5. Signature Management Tests

### 5.1 Save Signature in Settings
**Test Case ID:** TC-022  
**Description:** User saves signature in settings  
**Steps:**
1. Login as any user
2. Navigate to Settings
3. Draw or upload signature
4. Click "Save"

**Expected Results:**
- ✅ Signature saved to `users.signature_url`
- ✅ Signature visible in settings
- ✅ Success message displayed

**Validation Points:**
- [ ] Signature saved to database
- [ ] Signature visible after page refresh
- [ ] All users can save (not just approvers)

---

### 5.2 Use Saved Signature
**Test Case ID:** TC-023  
**Description:** Use saved signature when signing request  
**Steps:**
1. User has saved signature in settings
2. Open request requiring signature
3. Click "Use Saved Signature" button
4. Submit

**Expected Results:**
- ✅ Saved signature loaded
- ✅ Signature applied to request
- ✅ Request signed successfully

**Validation Points:**
- [ ] "Use Saved Signature" button appears
- [ ] Signature loads correctly
- [ ] Request signed with saved signature

---

## 6. Email Notification Tests

### 6.1 Signature Request Email
**Test Case ID:** TC-024  
**Description:** Email sent when signature required  
**Steps:**
1. Submit request on behalf of another person
2. Check requester's email

**Expected Results:**
- ✅ Email sent to requester
- ✅ Email contains request details
- ✅ Email contains signature link
- ✅ Link works correctly

**Validation Points:**
- [ ] Email sent successfully
- [ ] Email content is correct
- [ ] Link works
- [ ] Email template is formatted correctly

---

### 6.2 Participant Invitation Email
**Test Case ID:** TC-025  
**Description:** Email sent to seminar participants  
**Steps:**
1. Create seminar request
2. Add participants
3. Submit request

**Expected Results:**
- ✅ Email sent to each participant
- ✅ Email contains seminar details
- ✅ Email contains confirmation link
- ✅ Links work correctly

**Validation Points:**
- [ ] Emails sent to all participants
- [ ] Email content is correct
- [ ] Links work
- [ ] Email template is formatted correctly

---

## 7. SMS Notification Tests

### 7.1 Driver SMS on Final Approval
**Test Case ID:** TC-026  
**Description:** SMS sent to driver when request is finally approved  
**Steps:**
1. Create request with driver assigned
2. Approve through all stages
3. Final approval by President/VP

**Expected Results:**
- ✅ SMS sent to driver
- ✅ SMS contains travel details
- ✅ SMS contains requester contact number
- ✅ `sms_notification_sent` flag set to `true`

**Validation Points:**
- [ ] SMS sent successfully
- [ ] SMS content is correct
- [ ] Phone number format is correct (Philippines format)
- [ ] Flag set correctly

---

### 7.2 Driver SMS on Assignment
**Test Case ID:** TC-027  
**Description:** SMS sent when driver assigned to already-approved request  
**Steps:**
1. Approve request (no driver initially)
2. Admin assigns driver to approved request
3. Check driver's phone

**Expected Results:**
- ✅ SMS sent to driver
- ✅ SMS contains request details
- ✅ `sms_notification_sent` flag set

**Validation Points:**
- [ ] SMS sent successfully
- [ ] SMS content is correct
- [ ] Flag set correctly

---

## 8. File Code Generation Tests

### 8.1 Travel Order File Code
**Test Case ID:** TC-028  
**Description:** File code generated for travel order  
**Steps:**
1. Create travel order
2. Approve request
3. Assign driver
4. Check `file_code` field

**Expected Results:**
- ✅ File code generated automatically
- ✅ Format: `TO-YYYY-XXX-REQUESTER-DRIVER`
- ✅ Code updated when driver assigned
- ✅ Code visible in request details

**Validation Points:**
- [ ] File code format is correct
- [ ] Code generated on approval
- [ ] Code updated when driver assigned
- [ ] Code visible in UI

---

### 8.2 Seminar Application File Code
**Test Case ID:** TC-029  
**Description:** File code generated for seminar application  
**Steps:**
1. Create seminar request
2. Approve request
3. Check `file_code` and `seminar_code_per_person`

**Expected Results:**
- ✅ File code generated: `SA-YYYY-XXX-PERSON`
- ✅ Individual codes in `seminar_code_per_person` JSONB
- ✅ Codes visible in request details

**Validation Points:**
- [ ] File code format is correct
- [ ] Individual codes generated
- [ ] Codes visible in UI

---

## 9. UI/UX Tests

### 9.1 Request Card Consistency
**Test Case ID:** TC-030  
**Description:** Request cards display consistently across all views  
**Steps:**
1. Check inbox views (User, Head, Admin, HR, VP, President)
2. Check submissions view
3. Verify card design consistency

**Expected Results:**
- ✅ All cards use `RequestCardEnhanced` component
- ✅ Consistent design across all views
- ✅ All details displayed correctly
- ✅ Action buttons work correctly

**Validation Points:**
- [ ] Cards look identical across views
- [ ] All details visible
- [ ] Buttons work correctly
- [ ] Design is clean and user-friendly

---

### 9.2 Request Details View
**Test Case ID:** TC-031  
**Description:** Request details display all information  
**Steps:**
1. Open any request details view
2. Verify all fields displayed

**Expected Results:**
- ✅ All request fields visible
- ✅ Attachments displayed
- ✅ Contact numbers displayed
- ✅ Pickup preference displayed
- ✅ File code displayed
- ✅ All signatures visible

**Validation Points:**
- [ ] All fields displayed
- [ ] No missing information
- [ ] Layout is clean
- [ ] Download button works (if approved)

---

## 10. Edge Cases and Error Handling

### 10.1 Expired Invitation Link
**Test Case ID:** TC-032  
**Description:** Handle expired invitation link  
**Steps:**
1. Wait for invitation to expire (7 days)
2. Click expired link
3. Verify handling

**Expected Results:**
- ✅ Error message displayed
- ✅ "Resend" button available
- ✅ Resend regenerates token
- ✅ New link works

**Validation Points:**
- [ ] Expired link handled gracefully
- [ ] Resend option available
- [ ] New link works
- [ ] No crashes or errors

---

### 10.2 Invalid File Upload
**Test Case ID:** TC-033  
**Description:** Handle invalid file uploads  
**Steps:**
1. Try to upload file > 10MB
2. Try to upload unsupported file type
3. Verify error handling

**Expected Results:**
- ✅ File size validation works
- ✅ File type validation works
- ✅ Error messages displayed
- ✅ No crashes

**Validation Points:**
- [ ] File size limit enforced
- [ ] File type validation works
- [ ] Error messages are clear
- [ ] No system errors

---

### 10.3 Concurrent Approvals
**Test Case ID:** TC-034  
**Description:** Handle multiple approvers trying to approve same request  
**Steps:**
1. Two approvers open same request
2. Both try to approve simultaneously
3. Verify handling

**Expected Results:**
- ✅ First approval succeeds
- ✅ Second approval fails gracefully
- ✅ Error message displayed
- ✅ No data corruption

**Validation Points:**
- [ ] Race condition handled
- [ ] Error message is clear
- [ ] No data corruption
- [ ] Request state is consistent

---

## 11. Performance Tests

### 11.1 Large Request List
**Test Case ID:** TC-035  
**Description:** Handle inbox with many requests  
**Steps:**
1. Create 100+ requests
2. Open inbox
3. Verify performance

**Expected Results:**
- ✅ Page loads in reasonable time
- ✅ Pagination works (if implemented)
- ✅ No performance issues
- ✅ UI remains responsive

**Validation Points:**
- [ ] Page load time is acceptable
- [ ] No timeouts
- [ ] UI is responsive
- [ ] Memory usage is reasonable

---

## 12. Security Tests

### 12.1 RLS Policy Enforcement
**Test Case ID:** TC-036  
**Description:** Verify RLS policies work correctly  
**Steps:**
1. Login as different user roles
2. Try to access requests not belonging to them
3. Verify access control

**Expected Results:**
- ✅ Users can only see their own requests
- ✅ Heads can see department requests
- ✅ Admins can see all requests
- ✅ Approvers can see requests in their inbox

**Validation Points:**
- [ ] RLS policies enforced
- [ ] No unauthorized access
- [ ] Access control works correctly

---

### 12.2 Signature Access Control
**Test Case ID:** TC-037  
**Description:** Verify signature saving access  
**Steps:**
1. Login as different user roles
2. Try to save signature
3. Verify access

**Expected Results:**
- ✅ All users can save their signature
- ✅ Users can only save their own signature
- ✅ No unauthorized access

**Validation Points:**
- [ ] All users can save
- [ ] Access control works
- [ ] No security issues

---

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Database migrations applied
- [ ] Test users created (Faculty, Head, Admin, HR, VP, President)
- [ ] Test departments created
- [ ] Email service configured
- [ ] SMS service configured
- [ ] Supabase storage configured

### Test Execution
- [ ] Run all test cases
- [ ] Document any failures
- [ ] Verify fixes
- [ ] Re-test failed cases

### Post-Testing
- [ ] All test cases passed
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Security verified

---

## Notes

1. **Test Data**: Use realistic test data that matches production scenarios
2. **Cleanup**: Clean up test data after testing to avoid conflicts
3. **Logging**: Check server logs for any errors during testing
4. **Database**: Verify database state after each test case
5. **Email/SMS**: Check email and SMS delivery during testing

---

## Test Results Template

```
Test Case ID: TC-XXX
Date: YYYY-MM-DD
Tester: [Name]
Status: ✅ PASS / ❌ FAIL
Notes: [Any observations]
```

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0

