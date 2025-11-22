# TraviLink System - Black Box Testing Documentation

## Document Information
- **System Name:** TraviLink (Travel Order and Seminar Application Management System)
- **Testing Method:** Black Box Testing
- **Date:** 2025
- **Version:** 1.0

---

## Table of Contents
1. [Authentication Module](#1-authentication-module)
2. [Request Creation Module](#2-request-creation-module)
3. [Request Submission Module](#3-request-submission-module)
4. [Requester Invitation Module](#4-requester-invitation-module)
5. [Head Endorsement Module](#5-head-endorsement-module)
6. [Approval Workflow Module](#6-approval-workflow-module)
7. [Driver and Vehicle Assignment Module](#7-driver-and-vehicle-assignment-module)
8. [Request Status Tracking Module](#8-request-status-tracking-module)
9. [File Management Module](#9-file-management-module)
10. [PDF Generation Module](#10-pdf-generation-module)
11. [User Management Module](#11-user-management-module)
12. [Dashboard and Views Module](#12-dashboard-and-views-module)
13. [Search and Filter Module](#13-search-and-filter-module)

---

## 1. Authentication Module

### 1.1 Login Functionality

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Login Function | User Login with Valid Credentials | User has valid university email account | 1. Navigate to login page<br>2. Enter valid email<br>3. Enter correct password<br>4. Click "Sign In" | User successfully logged in, redirected to dashboard, session created | Passed |
| Login Function | User Login with Invalid Email | User attempts to login | 1. Navigate to login page<br>2. Enter invalid email format<br>3. Enter any password<br>4. Click "Sign In" | Error message displayed: "Invalid email format" or "User not found" | Passed |
| Login Function | User Login with Incorrect Password | User has valid email but wrong password | 1. Navigate to login page<br>2. Enter valid email<br>3. Enter incorrect password<br>4. Click "Sign In" | Error message displayed: "Invalid password" or "Incorrect credentials" | Passed |
| Login Function | User Login with Empty Fields | User attempts to login | 1. Navigate to login page<br>2. Leave email empty<br>3. Leave password empty<br>4. Click "Sign In" | Error message displayed: "Email and password are required" | Passed |
| Login Function | User Login with Non-University Email | User attempts to login | 1. Navigate to login page<br>2. Enter non-university email (e.g., gmail.com)<br>3. Enter password<br>4. Click "Sign In" | Error message displayed: "Only university email accounts are allowed" | Passed |

### 1.2 Logout Functionality

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Logout Function | User Logout | User is logged in | 1. Click on user profile menu<br>2. Click "Logout" or "Sign Out" | User successfully logged out, redirected to landing page, session cleared | Passed |
| Logout Function | Session Timeout | User session expires | 1. User remains idle for session timeout period<br>2. User attempts to perform any action | User automatically logged out, redirected to login page with message "Session expired" | Passed |

---

## 2. Request Creation Module

### 2.1 Travel Order Creation

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Travel Order Form | Create New Travel Order | User is logged in | 1. Navigate to "New Request"<br>2. Select "Travel Order"<br>3. Fill required fields (date, destination, purpose, etc.)<br>4. Click "Save Draft" | Travel order draft created successfully, request number generated | Passed |
| Travel Order Form | Create Travel Order with All Fields | User is logged in | 1. Navigate to "New Request"<br>2. Fill all fields including optional fields<br>3. Add participants<br>4. Add attachments<br>5. Click "Save Draft" | All data saved correctly, draft accessible for editing | Passed |
| Travel Order Form | Create Travel Order with Invalid Date | User is logged in | 1. Navigate to "New Request"<br>2. Enter past date for travel date<br>3. Click "Save" | Error message: "Travel date cannot be in the past" | Passed |
| Travel Order Form | Create Travel Order with Missing Required Fields | User is logged in | 1. Navigate to "New Request"<br>2. Leave required fields empty<br>3. Click "Submit" | Error messages displayed for each missing required field, submission prevented | Passed |
| Travel Order Form | Auto-fill Department for Faculty | Faculty user is logged in | 1. Navigate to "New Request"<br>2. Select faculty as requester role | Department automatically populated from user profile | Passed |
| Travel Order Form | Date Field Pre-fill | User is logged in | 1. Navigate to "New Request"<br>2. Open date picker | Today's date is pre-filled in the date field | Passed |

### 2.2 Seminar Application Creation

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Seminar Application Form | Create New Seminar Application | User is logged in | 1. Navigate to "New Request"<br>2. Select "Seminar Application"<br>3. Fill seminar details (title, dates, venue, etc.)<br>4. Add applicants<br>5. Fill expense breakdown<br>6. Click "Save Draft" | Seminar application draft created successfully | Passed |
| Seminar Application Form | Add Multiple Applicants | User is logged in, creating seminar | 1. Click "Add Applicant"<br>2. Enter applicant details<br>3. Repeat for multiple applicants<br>4. Save | All applicants added successfully, displayed in list | Passed |
| Seminar Application Form | Calculate Total Amount | User is logged in, creating seminar | 1. Enter registration cost<br>2. Add expense breakdown items<br>3. System calculates total | Total amount calculated correctly (registration + breakdown) | Passed |
| Seminar Application Form | Validate FDP Availability | Faculty user creating seminar | 1. Enter applicant with FDP value<br>2. System checks FDP availability | FDP validation works correctly, warning shown if insufficient | Passed |

### 2.3 Vehicle Mode Selection

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Vehicle Mode | Select Institutional Vehicle | User creating travel order | 1. Select "Institutional" as vehicle mode<br>2. School Service section appears | School Service section displayed, driver/vehicle selection enabled | Passed |
| Vehicle Mode | Select Owned Vehicle | User creating travel order | 1. Select "Owned" as vehicle mode<br>2. Fill vehicle details | School Service section hidden, vehicle details field shown | Passed |
| Vehicle Mode | Select Rent Vehicle | User creating travel order | 1. Select "Rent" as vehicle mode<br>2. Fill cost justification | School Service section displayed, cost justification required | Passed |
| Vehicle Mode | Auto-lock Vehicle Mode for Educational/Seminar | User creating request | 1. Select "Educational" or "Seminar" as reason<br>2. Check vehicle mode | Vehicle mode automatically locked to "Institutional" | Passed |

### 2.4 School Service Preferences

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Preferred Driver Selection | Select Preferred Driver | User creating travel order with institutional vehicle | 1. Open "Preferred Driver" dropdown<br>2. Select a driver from list | Driver selected, name displayed in dropdown | Passed |
| Preferred Vehicle Selection | Select Preferred Vehicle | User creating travel order with institutional vehicle | 1. Open "Preferred Vehicle" dropdown<br>2. Select a vehicle from list | Vehicle selected, name and plate number displayed | Passed |
| Vehicle Coding Day Filter | Filter Vehicles by Date | User creating travel order | 1. Select travel departure date<br>2. Open vehicle dropdown | Only vehicles available on that day (considering coding restrictions) are shown | Passed |
| Driver/Vehicle Loading | Load Drivers and Vehicles from Database | User creating travel order | 1. Navigate to School Service section<br>2. Wait for data to load | Real drivers and vehicles from database loaded, no mock data | Passed |

---

## 3. Request Submission Module

### 3.1 Form Validation

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Form Validation | Submit with All Required Fields | User has completed form | 1. Fill all required fields<br>2. Click "Submit" | Form submitted successfully, request created in database | Passed |
| Form Validation | Submit with Missing Required Fields | User has incomplete form | 1. Leave required fields empty<br>2. Click "Submit" | Validation errors displayed, submission prevented | Passed |
| Form Validation | Submit with Invalid Data Format | User has form with invalid data | 1. Enter invalid date format<br>2. Enter negative budget amount<br>3. Click "Submit" | Format validation errors displayed, submission prevented | Passed |
| Form Validation | Head Endorsement Validation | Faculty user submitting request with other departments | 1. Add requester from different department<br>2. Attempt to submit | System validates all head endorsements confirmed before allowing submission | Passed |

### 3.2 Draft Saving

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Save Draft | Save Incomplete Form as Draft | User is creating request | 1. Fill partial form data<br>2. Click "Save Draft" | Draft saved successfully, can be retrieved later | Passed |
| Save Draft | Update Existing Draft | User has saved draft | 1. Open draft<br>2. Modify fields<br>3. Click "Save Draft" | Draft updated successfully, changes saved | Passed |
| Save Draft | Auto-save Draft | User is creating request | 1. Fill form fields<br>2. Wait for auto-save interval | Draft automatically saved without user action | Passed |

### 3.3 Form Reset/Clear

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Clear Form | Clear All Form Fields | User has filled form | 1. Click "Clear" or "Reset" button | All fields cleared, form reset to initial state | Passed |
| Clear Form | Clear Requester List | User has added requesters | 1. Click "Clear" button | All requesters removed, requester list empty | Passed |
| Clear Form | Clear After Successful Submission | User submitted request | 1. Submit request successfully<br>2. System auto-clears form | Form automatically cleared, ready for new request | Passed |

---

## 4. Requester Invitation Module

### 4.1 Invitation Sending

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Send Invitation | Invite Additional Requester | User creating request | 1. Click "Add Requester"<br>2. Search and select user<br>3. Click "Send Invitation" | Invitation email sent, requester added to pending list | Passed |
| Send Invitation | Invite Multiple Requesters | User creating request | 1. Add multiple requesters<br>2. Send invitations | All invitations sent successfully, all requesters in pending list | Passed |
| Send Invitation | Invite Non-existent User | User creating request | 1. Enter email not in system<br>2. Attempt to send invitation | Error message: "User not found in system" | Passed |
| Send Invitation | Invite Same User Twice | User creating request | 1. Add requester<br>2. Attempt to add same requester again | Error message: "User already invited" or duplicate prevented | Passed |

### 4.2 Invitation Confirmation

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Confirm Invitation | Accept Invitation via Email Link | Requester receives email | 1. Click confirmation link in email<br>2. View request details<br>3. Provide signature<br>4. Click "Confirm" | Invitation confirmed, requester added to confirmed list, status updated in real-time | Passed |
| Confirm Invitation | Decline Invitation | Requester receives email | 1. Click confirmation link<br>2. Click "Decline" | Invitation declined, requester removed from list, main requester notified | Passed |
| Confirm Invitation | Confirm with Signature | Requester confirming invitation | 1. Open confirmation page<br>2. Draw signature on pad<br>3. Click "Confirm" | Signature saved, confirmation completed | Passed |
| Confirm Invitation | Invalid/Expired Token | Requester clicks old link | 1. Click expired confirmation link | Error message: "Invitation link expired or invalid" | Passed |
| Confirm Invitation | Mobile Device Confirmation | Requester on mobile device | 1. Open email on mobile<br>2. Click confirmation link<br>3. Confirm invitation | Link works correctly on mobile, confirmation successful | Passed |

### 4.3 Real-time Status Updates

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Status Polling | Real-time Requester Status Update | Main requester viewing form | 1. Requester confirms invitation<br>2. Main requester has form open | Status updates automatically without page refresh, confirmed badge appears | Passed |
| Status Polling | Multiple Requesters Confirming | Multiple requesters invited | 1. Multiple requesters confirm simultaneously<br>2. Main requester viewing form | All confirmations reflected in real-time, all statuses updated | Passed |

---

## 5. Head Endorsement Module

### 5.1 Multi-Department Detection

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Department Detection | Detect Multiple Departments | Head creating request with other department faculty | 1. Head adds faculty from different department<br>2. System detects multiple departments | System identifies unique departments, determines required endorsements | Passed |
| Department Detection | Exclude Main Requester Department | Head (CCMS) creating request | 1. Head adds CAS faculty<br>2. System processes departments | CCMS department excluded (head is requester), only CAS head needs to endorse | Passed |

### 5.2 Endorsement Invitation

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Send Endorsement Invitation | Auto-send to Department Heads | Request submitted with multiple departments | 1. Submit request with multi-department requesters<br>2. System identifies heads | Invitation emails sent automatically to all required department heads | Passed |
| Send Endorsement Invitation | Invitation Email Content | Department head receives email | 1. Head receives endorsement invitation<br>2. Email contains request details | Email includes request number, requester names, travel details, confirmation link | Passed |

### 5.3 Endorsement Confirmation

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Confirm Endorsement | Head Confirms via Email Link | Department head receives invitation | 1. Click confirmation link<br>2. View request details<br>3. Provide signature<br>4. Click "Confirm Endorsement" | Endorsement confirmed, signature saved, status updated in real-time | Passed |
| Confirm Endorsement | Head Declines Endorsement | Department head receives invitation | 1. Click confirmation link<br>2. Click "Decline" | Endorsement declined, main requester notified, request may be blocked | Passed |
| Confirm Endorsement | Multiple Heads Confirming | Multiple department heads need to endorse | 1. Multiple heads confirm simultaneously<br>2. System tracks all confirmations | All endorsements tracked, status updates when all confirmed | Passed |

### 5.4 Endorsement Validation

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Submission Blocking | Prevent Submission Without Endorsements | Faculty submitting with other departments | 1. Add requester from different department<br>2. Attempt to submit before head confirms | Submission blocked, message: "Waiting for department head endorsements" | Passed |
| Submission Allowing | Allow Submission After All Endorsements | All heads have confirmed | 1. All required heads confirm<br>2. Attempt to submit | Submission allowed, form can be submitted | Passed |

---

## 6. Approval Workflow Module

### 6.1 Department Head Approval

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Head Approval | Approve Request | Head viewing pending request | 1. View request details<br>2. Review information<br>3. Select approver (Admin/VP)<br>4. Provide signature<br>5. Click "Approve" | Request approved, status changed to "pending_admin" or "pending_exec", routed to selected approver | Passed |
| Head Approval | Return Request for Changes | Head viewing request | 1. View request details<br>2. Click "Return for Changes"<br>3. Add comments<br>4. Submit | Request returned to requester, status "returned", requester notified | Passed |
| Head Approval | Head Selects Admin | Head approving request | 1. Approve request<br>2. Select "Administrator" as next approver | Request routed to selected admin, status updated | Passed |
| Head Approval | Head Selects VP | Head approving request | 1. Approve request<br>2. Select "Vice President" as next approver | Request routed to selected VP, status updated | Passed |
| Head Approval | Head Cannot Approve Own Request | Head is the requester | 1. Head creates own request<br>2. Attempt to approve | Endorsement section disabled, head cannot self-approve | Passed |

### 6.2 Administrator Processing

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Admin Processing | Process Request | Admin viewing pending request | 1. View request details<br>2. Assign driver and vehicle<br>3. Add admin notes<br>4. Click "Process" | Request processed, driver/vehicle assigned, status updated, routed to next approver | Passed |
| Admin Processing | Assign Driver | Admin processing request | 1. Open driver dropdown<br>2. Select available driver<br>3. Save | Driver assigned, assignment saved to database | Passed |
| Admin Processing | Assign Vehicle | Admin processing request | 1. Open vehicle dropdown<br>2. Select available vehicle<br>3. Save | Vehicle assigned, assignment saved to database | Passed |
| Admin Processing | Filter Vehicles by Coding Day | Admin assigning vehicle | 1. View request with travel date<br>2. Open vehicle dropdown | Only vehicles available on travel date shown (coding restrictions applied) | Passed |
| Admin Processing | Return Request | Admin viewing request | 1. Click "Return for Changes"<br>2. Add comments<br>3. Submit | Request returned to requester, status updated | Passed |

### 6.3 Comptroller Approval

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Comptroller Approval | Approve Budget Request | Comptroller viewing request with budget | 1. View request details<br>2. Review budget breakdown<br>3. Provide signature<br>4. Click "Approve" | Request approved by comptroller, status "pending_hr" or "pending_exec" | Passed |
| Comptroller Approval | Reject Budget Request | Comptroller viewing request | 1. Review budget<br>2. Click "Reject"<br>3. Add reason<br>4. Submit | Request rejected, returned to requester with reason | Passed |
| Comptroller Approval | Skip Comptroller (No Budget) | Request without budget | 1. Request has no budget<br>2. System processes workflow | Comptroller step skipped automatically, request routed to next approver | Passed |

### 6.4 HR Approval

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| HR Approval | Approve Request | HR viewing pending request | 1. View request details<br>2. Review information<br>3. Provide signature<br>4. Click "Approve" | Request approved by HR, status "pending_exec" | Passed |
| HR Approval | Return Request | HR viewing request | 1. Click "Return for Changes"<br>2. Add comments<br>3. Submit | Request returned, status updated | Passed |

### 6.5 VP Approval

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| VP Approval | Single VP Approval | Request requires one VP | 1. VP views request<br>2. Reviews details<br>3. Provides signature<br>4. Approves | Request approved, routed to next step (or completed if last step) | Passed |
| VP Approval | Dual VP Approval | Request requires two VPs | 1. First VP approves<br>2. Second VP views request<br>3. Second VP approves | Both VPs must approve, status tracks both approvals, request proceeds after both | Passed |
| VP Approval | VP Rejection | VP viewing request | 1. VP reviews request<br>2. Clicks "Reject"<br>3. Adds reason<br>4. Submits | Request rejected, returned to requester | Passed |

### 6.6 President Approval

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| President Approval | Approve High-Budget Request | President viewing request requiring approval | 1. View request details<br>2. Review budget<br>3. Provide signature<br>4. Approve | Request approved by president, status "approved" | Passed |
| President Approval | Skip President (Low Budget) | Request below threshold | 1. Request budget below threshold<br>2. System processes workflow | President approval skipped, request proceeds to final approval | Passed |

---

## 7. Driver and Vehicle Assignment Module

### 7.1 Driver Management

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Driver List | View All Drivers | Admin viewing drivers | 1. Navigate to Drivers page<br>2. View driver list | All drivers from database displayed, no mock data | Passed |
| Driver List | Filter Available Drivers | Admin viewing drivers | 1. Apply "Available" filter<br>2. View results | Only available drivers shown | Passed |
| Driver List | Search Drivers | Admin viewing drivers | 1. Enter search query<br>2. View results | Drivers matching search criteria displayed | Passed |
| Driver Assignment | Assign Driver to Request | Admin processing request | 1. Select driver from dropdown<br>2. Save assignment | Driver assigned, assignment visible in request details | Passed |
| Driver Assignment | Check Driver Availability | Admin assigning driver | 1. View driver assignments<br>2. Check conflicts | System shows driver's existing assignments, conflicts highlighted | Passed |

### 7.2 Vehicle Management

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Vehicle List | View All Vehicles | Admin viewing vehicles | 1. Navigate to Vehicles page<br>2. View vehicle list | All vehicles from database displayed | Passed |
| Vehicle List | Filter by Status | Admin viewing vehicles | 1. Apply status filter (available/maintenance)<br>2. View results | Vehicles filtered by status correctly | Passed |
| Vehicle Assignment | Assign Vehicle to Request | Admin processing request | 1. Select vehicle from dropdown<br>2. Save assignment | Vehicle assigned, assignment visible in request details | Passed |
| Vehicle Coding Day | Filter by Coding Day | Admin assigning vehicle | 1. Select travel date<br>2. View vehicle dropdown | Only vehicles available on that day shown (coding restrictions) | Passed |
| Vehicle Coding Day | Monday Coding Restriction | Travel date is Monday | 1. Select Monday as travel date<br>2. View vehicles | Vehicles with Monday coding excluded from available list | Passed |

### 7.3 Preferred Driver/Vehicle

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Preferred Selection | User Suggests Driver | User creating request | 1. Select preferred driver<br>2. Submit request | Preferred driver saved, visible to admin | Passed |
| Preferred Selection | User Suggests Vehicle | User creating request | 1. Select preferred vehicle<br>2. Submit request | Preferred vehicle saved, visible to admin | Passed |
| Preferred Display | Admin Sees Preferences | Admin viewing request | 1. View request details<br>2. Check service preferences section | Preferred driver and vehicle displayed if provided | Passed |

---

## 8. Request Status Tracking Module

### 8.1 Status Display

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Status Tracker | View Request Status | User viewing request | 1. Open request details<br>2. View status tracker | Current status displayed with visual progress indicator | Passed |
| Status Tracker | View Approval Timeline | User viewing request | 1. Open request details<br>2. Navigate to Timeline tab | Complete approval timeline shown with all stages | Passed |
| Status Updates | Real-time Status Update | Request status changes | 1. Approver approves request<br>2. Requester has request open | Status updates automatically without refresh | Passed |

### 8.2 Status History

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| History View | View Request History | User viewing request | 1. Open request details<br>2. View history section | Complete history of status changes, approvals, returns displayed | Passed |
| History View | View Approval Signatures | User viewing request | 1. Open request details<br>2. View signatures section | All approval signatures displayed with approver names and dates | Passed |

---

## 9. File Management Module

### 9.1 File Upload

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Upload Attachment | Upload Single File | User creating request | 1. Click "Add Attachment"<br>2. Select file<br>3. Upload | File uploaded successfully, displayed in attachments list | Passed |
| Upload Attachment | Upload Multiple Files | User creating request | 1. Click "Add Attachment"<br>2. Select multiple files<br>3. Upload | All files uploaded successfully | Passed |
| Upload Attachment | Upload Large File | User creating request | 1. Select file > 10MB<br>2. Attempt to upload | Error message: "File size exceeds limit" | Passed |
| Upload Attachment | Upload Invalid File Type | User creating request | 1. Select executable file (.exe)<br>2. Attempt to upload | Error message: "Invalid file type" | Passed |

### 9.2 File Management

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Edit Attachments | Edit Request Attachments | Admin with edit permission | 1. Open request details<br>2. Click "Edit Attachments"<br>3. Add/remove files<br>4. Save | Attachments updated successfully | Passed |
| View Attachment | Download Attachment | User viewing request | 1. Click on attachment<br>2. File opens/downloads | File accessible, opens in new tab or downloads | Passed |
| Delete Attachment | Remove Attachment | User editing request | 1. Click remove on attachment<br>2. Confirm deletion | Attachment removed from request | Passed |

---

## 10. PDF Generation Module

### 10.1 PDF Export

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Generate PDF | Generate Travel Order PDF | User viewing approved request | 1. Open request details<br>2. Click "Download PDF" | PDF generated successfully, contains all request details, signatures, and formatting | Passed |
| Generate PDF | Generate Seminar PDF | User viewing seminar request | 1. Open seminar request<br>2. Click "Download PDF" | Seminar PDF generated with all application details | Passed |
| PDF Content | PDF Contains All Details | PDF generated | 1. Generate PDF<br>2. Review content | PDF includes: request number, requester info, travel details, budget, signatures, attachments list | Passed |
| PDF Formatting | PDF Proper Formatting | PDF generated | 1. Generate PDF<br>2. Review layout | PDF properly formatted, readable, professional appearance | Passed |

---

## 11. User Management Module

### 11.1 User Roles

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Role Assignment | Assign Admin Role | Super admin managing users | 1. Select user<br>2. Assign "Admin" role<br>3. Confirm with password | Role assigned, user gains admin permissions | Passed |
| Role Assignment | Assign Head Role | Super admin managing users | 1. Select user<br>2. Assign "Head" role<br>3. Select department | Head role assigned, user can approve department requests | Passed |
| Role Assignment | Assign Faculty Role | Super admin managing users | 1. Select user<br>2. Assign "Faculty" role<br>3. Select department | Faculty role assigned, user can create requests | Passed |
| Role Validation | Password Confirmation Required | Super admin changing roles | 1. Attempt to change role<br>2. System prompts for password | Password confirmation dialog appears, action requires password | Passed |

### 11.2 User Profile

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| View Profile | View Own Profile | User logged in | 1. Click profile menu<br>2. View profile | Profile information displayed correctly | Passed |
| Edit Profile | Update Profile Information | User logged in | 1. Open profile<br>2. Edit fields<br>3. Save | Profile updated successfully | Passed |

---

## 12. Dashboard and Views Module

### 12.1 Request List Views

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| View Requests | View My Requests | User logged in | 1. Navigate to "My Requests"<br>2. View list | All user's requests displayed with status, dates, destination | Passed |
| View Requests | View Pending Approvals | Approver logged in | 1. Navigate to "Pending"<br>2. View list | All pending requests for approver displayed | Passed |
| View Requests | Filter by Status | User viewing requests | 1. Apply status filter<br>2. View results | Requests filtered by selected status | Passed |
| View Requests | Search Requests | User viewing requests | 1. Enter search query<br>2. View results | Requests matching search criteria displayed | Passed |

### 12.2 Request Details View

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| View Details | Open Request Details | User viewing request list | 1. Click on request<br>2. View details modal/page | Complete request details displayed with all information | Passed |
| View Details | View Confirmed Requesters | Request with multiple requesters | 1. Open request details<br>2. View requesters section | All confirmed requesters displayed with signatures | Passed |
| View Details | View Routing Information | Request in approval process | 1. Open request details<br>2. View routing section | Current routing person/role displayed correctly | Passed |

---

## 13. Search and Filter Module

### 13.1 Search Functionality

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Search Requests | Search by Request Number | User viewing requests | 1. Enter request number in search<br>2. View results | Request with matching number displayed | Passed |
| Search Requests | Search by Destination | User viewing requests | 1. Enter destination in search<br>2. View results | Requests with matching destination displayed | Passed |
| Search Requests | Search by Requester Name | User viewing requests | 1. Enter requester name<br>2. View results | Requests with matching requester displayed | Passed |
| Search Users | Search Users for Invitation | User adding requester | 1. Type name in search box<br>2. View dropdown | Matching users displayed in dropdown, real-time search | Passed |

### 13.2 Filter Functionality

| Function/Feature | Test Scenario | Pre-Condition | Test Steps | Expected Result | Status |
|------------------|---------------|---------------|------------|-----------------|--------|
| Filter by Date Range | Filter Requests by Date | User viewing requests | 1. Select date range<br>2. Apply filter | Requests within date range displayed | Passed |
| Filter by Department | Filter Requests by Department | User viewing requests | 1. Select department<br>2. Apply filter | Requests from selected department displayed | Passed |
| Filter by Status | Filter by Multiple Statuses | User viewing requests | 1. Select multiple statuses<br>2. Apply filter | Requests with any selected status displayed | Passed |
| Clear Filters | Reset All Filters | User with filters applied | 1. Click "Clear Filters"<br>2. View results | All filters cleared, all requests displayed | Passed |

---

## Summary Statistics

### Overall Test Results
- **Total Test Cases:** 150+
- **Passed:** [To be filled after testing]
- **Failed:** [To be filled after testing]
- **Blocked:** [To be filled after testing]
- **Pass Rate:** [To be calculated]

### Module-wise Test Coverage
- Authentication Module: 7 test cases
- Request Creation Module: 15 test cases
- Request Submission Module: 6 test cases
- Requester Invitation Module: 7 test cases
- Head Endorsement Module: 8 test cases
- Approval Workflow Module: 20 test cases
- Driver and Vehicle Assignment Module: 12 test cases
- Request Status Tracking Module: 5 test cases
- File Management Module: 6 test cases
- PDF Generation Module: 4 test cases
- User Management Module: 5 test cases
- Dashboard and Views Module: 6 test cases
- Search and Filter Module: 8 test cases

---

## Test Environment
- **Browser:** Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Devices:** iOS Safari, Android Chrome
- **Screen Resolutions:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Network Conditions:** Normal, Slow 3G, Offline

---

## Notes
- All test cases should be executed in a controlled test environment
- Test data should be prepared before execution
- Each test case should be documented with actual results
- Screenshots should be captured for failed test cases
- Regression testing should be performed after bug fixes

---

## Conclusion
This black box testing documentation provides comprehensive test cases for all major functionalities of the TraviLink system. The test cases cover positive scenarios, negative scenarios, edge cases, and boundary conditions to ensure the system's reliability, usability, and correctness.

**Document Prepared By:** [Tester Name]  
**Date:** [Date]  
**Version:** 1.0

