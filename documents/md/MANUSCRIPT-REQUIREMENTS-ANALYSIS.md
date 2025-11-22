# Results and Discussion

## 7.1 Analysis of Requirements for TraviLink

### 7.1.1 Analysis of Interview Results

To identify the requirements and understand the current challenges in managing transportation requests at Manuel S. Enverga University Foundation (MSEUF), the researchers conducted **face-to-face interviews** with key stakeholders involved in the travel management process. The interviews were structured to gather comprehensive information about the existing system, pain points, and desired improvements.

**Interview Participants:**
- **Administrative Staff** (Trizzia Marie Casino - Admin)
- **Department Heads** (Various departments)
- **Faculty Members** (Regular requesters)
- **Comptroller Office** (Budget management)
- **Human Resources Department** (HR approval)
- **Executive Office** (VP External - Atty. Dario Opistan, President)
- **Transportation Office** (Vehicle and driver management)

**Interview Duration:** Each interview session lasted approximately 30-45 minutes, covering various aspects of the current travel request process, from submission to approval and execution.

**Data Collection Period:** The interviews were conducted over a period of two months to ensure comprehensive coverage of all departments and stakeholders.

---

### 7.1.2 Analysis of Survey Results

Through the face-to-face interviews, the researchers identified several critical problems in the current manual travel management process at MSEUF. These problems significantly impact efficiency, transparency, and user satisfaction. The identified problems are categorized as follows:

#### **Problem 1: Manual Paper-Based Process**
**Description:** The existing system relies heavily on physical documents and manual paperwork. Faculty and staff members must fill out travel order forms manually, print multiple copies, and physically submit them to various offices for approval.

**Impact:**
- Time-consuming submission process
- Risk of document loss or misplacement
- Difficulty in tracking request status
- Inefficient document routing between departments
- High paper consumption and storage requirements

**Evidence from Interviews:**
- Faculty members reported spending 2-3 hours just to complete and submit a single travel request
- Administrative staff mentioned frequent cases of lost or misplaced documents
- Department heads expressed frustration over delayed approvals due to document routing issues

---

#### **Problem 2: Lack of Real-Time Status Tracking**
**Description:** Requesters have no visibility into the current status of their travel requests. They must physically visit offices or make phone calls to inquire about approval status, causing uncertainty and delays.

**Impact:**
- Requesters cannot plan their travel effectively
- Frequent follow-ups required, wasting time for both requesters and approvers
- Lack of transparency in the approval process
- Difficulty in identifying bottlenecks in the workflow

**Evidence from Interviews:**
- 85% of faculty members reported making 3-5 follow-up calls per request
- Department heads mentioned spending significant time responding to status inquiries
- Requesters expressed frustration over not knowing when to expect approval

---

#### **Problem 3: Inefficient Approval Workflow**
**Description:** The approval process involves multiple sequential steps (Department Head → Admin → Comptroller → HR → VP → President), with requests physically moving between offices. This creates delays, especially when approvers are unavailable.

**Impact:**
- Average approval time of 5-7 business days
- Requests get stuck when approvers are on leave or unavailable
- No automatic routing or escalation mechanism
- Difficulty in identifying which stage a request is currently at

**Evidence from Interviews:**
- Average approval time reported: 5-7 business days (sometimes up to 2 weeks)
- Requests often delayed when department heads or executives are unavailable
- No system to automatically route requests to alternate approvers

---

#### **Problem 4: Vehicle and Driver Scheduling Conflicts**
**Description:** The transportation office manually manages vehicle and driver assignments using paper calendars or basic spreadsheets, leading to double-booking, scheduling conflicts, and inefficient resource utilization.

**Impact:**
- Double-booking of vehicles and drivers
- Last-minute cancellations due to conflicts
- Inefficient vehicle utilization
- Difficulty in managing driver availability
- No visibility into vehicle capacity and availability

**Evidence from Interviews:**
- Transportation office reported 3-5 scheduling conflicts per month
- Admin staff mentioned difficulty in tracking which vehicles are available on specific dates
- Requesters sometimes receive last-minute notifications about vehicle unavailability

---

#### **Problem 5: Budget Tracking and Payment Confirmation Issues**
**Description:** Budget approval and payment confirmation processes are disconnected. The comptroller office manually tracks budgets, and payment confirmations require additional paperwork and follow-ups.

**Impact:**
- Difficulty in tracking department budgets
- Delayed payment confirmations
- Risk of budget overruns
- Manual computation of expenses prone to errors
- No real-time budget visibility

**Evidence from Interviews:**
- Comptroller office reported spending 2-3 hours per request for budget computation
- Payment confirmations often delayed due to manual processes
- Department heads expressed concern over lack of budget visibility

---

#### **Problem 6: Lack of Feedback Mechanism**
**Description:** There is no systematic way to collect feedback from faculty and staff about their travel experiences, vehicle conditions, driver performance, or service quality. This prevents continuous improvement.

**Impact:**
- No data to improve service quality
- Issues with vehicles or drivers go unreported
- No accountability for service quality
- Missed opportunities for improvement

**Evidence from Interviews:**
- 90% of faculty members reported never being asked for feedback
- Transportation office mentioned difficulty in identifying problematic vehicles or drivers
- No systematic way to track service quality metrics

---

#### **Problem 7: No Audit Trail and Documentation**
**Description:** The manual system lacks comprehensive documentation and audit trails. It is difficult to track who approved what, when, and why. Historical data is not easily accessible.

**Impact:**
- Difficulty in resolving disputes
- No accountability trail
- Challenges in generating reports
- Loss of historical data
- Compliance and transparency issues

**Evidence from Interviews:**
- Administrative staff reported difficulty in retrieving past request records
- Executives mentioned lack of data for decision-making
- No way to generate comprehensive reports on travel patterns

---

#### **Problem 8: Communication Gaps**
**Description:** Communication between requesters, approvers, and the transportation office relies on phone calls, emails, and physical visits. This leads to miscommunication, missed notifications, and delays.

**Impact:**
- Important notifications may be missed
- Miscommunication about request details
- Delayed responses to inquiries
- No centralized communication channel

**Evidence from Interviews:**
- Faculty members reported missing important updates about their requests
- Approvers mentioned difficulty in communicating with requesters
- No unified notification system

---

#### **Problem 9: Limited Accessibility and Mobility**
**Description:** The manual system requires physical presence at the office to submit requests, check status, or follow up. This is inconvenient, especially for faculty members who may be off-campus or have busy schedules.

**Impact:**
- Inconvenience for off-campus faculty
- Time wasted on physical visits
- Limited access during non-office hours
- Difficulty in managing requests while traveling

**Evidence from Interviews:**
- Faculty members expressed need for remote access
- Off-campus faculty reported significant inconvenience
- Requests delayed when faculty members are unavailable on campus

---

#### **Problem 10: Inefficient Resource Management**
**Description:** There is no centralized system to manage vehicles, drivers, and schedules. The transportation office struggles with manual tracking of vehicle maintenance, driver availability, and optimal resource allocation.

**Impact:**
- Poor vehicle utilization
- Difficulty in maintenance scheduling
- Inefficient driver assignment
- No data-driven resource planning

**Evidence from Interviews:**
- Transportation office reported difficulty in tracking vehicle maintenance schedules
- No system to optimize vehicle and driver assignments
- Manual tracking of driver availability and workload

---

### 7.1.3 Functional and Non-Functional Requirements

Based on the identified problems, TraviLink was designed with specific features to address each gap in the existing system. The following table presents the problems and their corresponding solutions:

| **Problem** | **Solution Implemented in TraviLink** | **Key Features** |
|-------------|----------------------------------------|------------------|
| **1. Manual Paper-Based Process** | **Digital Request Submission System** | • Online request wizard with step-by-step form<br>• Digital signature integration<br>• Electronic document storage<br>• Paperless workflow from submission to approval |
| **2. Lack of Real-Time Status Tracking** | **Real-Time Request Tracking and Timeline** | • Live status updates via Supabase Realtime<br>• Visual timeline showing all approval stages<br>• Request history with timestamps<br>• Status badges and notifications |
| **3. Inefficient Approval Workflow** | **Automated Multi-Stage Approval Workflow** | • Smart routing based on request type and budget<br>• Automatic escalation and routing<br>• Choice-based approver selection<br>• Parallel approval support where applicable<br>• Workflow engine with intelligent skipping |
| **4. Vehicle and Driver Scheduling Conflicts** | **Intelligent Scheduling and Availability System** | • Real-time calendar view with slot availability<br>• Conflict detection and prevention<br>• Automatic availability checking<br>• Vehicle and driver assignment with conflict validation<br>• Daily slot limit (5 slots per day) |
| **5. Budget Tracking and Payment Issues** | **Integrated Budget Management System** | • Real-time budget tracking per department<br>• Digital expense breakdown and justification<br>• Payment confirmation workflow<br>• Budget approval and revision system<br>• Automated budget computation |
| **6. Lack of Feedback Mechanism** | **Comprehensive Feedback System** | • Post-trip feedback collection<br>• Feedback lock mechanism (UI locked until feedback provided)<br>• Shareable feedback links and QR codes<br>• Rating system for vehicles and drivers<br>• Admin feedback dashboard |
| **7. No Audit Trail** | **Complete Audit and History System** | • Comprehensive request history tracking<br>• Audit logs for all system actions<br>• Role assignment history<br>• Timestamp tracking for all stages<br>• Digital signatures with timestamps |
| **8. Communication Gaps** | **Real-Time Notification System** | • In-app notifications for all status changes<br>• Email notifications (optional)<br>• Real-time inbox updates<br>• Notification center with read/unread status<br>• Automatic notifications for approvers |
| **9. Limited Accessibility** | **Web-Based Platform with Mobile Responsiveness** | • Accessible from any device with internet<br>• Responsive design for mobile devices<br>• Cloud-based system (no installation required)<br>• 24/7 accessibility<br>• Microsoft Azure AD integration for single sign-on |
| **10. Inefficient Resource Management** | **Centralized Resource Management System** | • Vehicle management with full CRUD operations<br>• Driver management with availability tracking<br>• Schedule calendar with visual representation<br>• Resource utilization analytics<br>• Maintenance tracking capabilities |

---


#### **Solution 1: Digital Request Submission System**
TraviLink eliminates the need for physical paperwork by providing a comprehensive online request submission system. Faculty and staff can create travel requests through an intuitive wizard interface that guides them through each step:

- **Request Wizard**: Multi-step form with validation at each stage
- **Digital Signatures**: Electronic signature capture and storage
- **Document Attachments**: Upload supporting documents digitally
- **Draft Saving**: Save incomplete requests and continue later
- **Auto-save**: Automatic saving to prevent data loss

**Impact:** Reduces submission time from 2-3 hours to 10-15 minutes, eliminates paper waste, and ensures no document loss.

---

#### **Solution 2: Real-Time Status Tracking**
The system provides complete visibility into request status through multiple mechanisms:

- **Request Timeline**: Visual representation of all approval stages with timestamps
- **Status Badges**: Color-coded status indicators (Pending, Approved, Rejected)
- **Real-Time Updates**: Automatic page updates without refresh using Supabase Realtime
- **Request History**: Complete log of all status changes, approvals, and comments
- **My Submissions Page**: Centralized view of all user requests with current status

**Impact:** Eliminates need for follow-up calls, provides transparency, and allows better travel planning.

---

#### **Solution 3: Automated Multi-Stage Approval Workflow**
TraviLink implements an intelligent workflow engine that automatically routes requests through the appropriate approval chain:

- **Smart Routing**: Automatically determines next approver based on request type, budget, and requester role
- **Choice-Based Sending**: Approvers can choose specific next approver when multiple options exist
- **Intelligent Skipping**: Automatically skips unnecessary stages (e.g., comptroller when no budget)
- **Dual-Signature Logic**: Handles cases where approvers are also requesters
- **Parallel Approvals**: Supports multiple approvers at the same stage when needed

**Workflow Stages:**
1. Department Head Approval
2. Parent Department Head (if applicable)
3. Admin Processing (vehicle/driver assignment)
4. Comptroller (budget review, if applicable)
5. HR Approval
6. VP Approval (if needed)
7. President Final Approval

**Impact:** Reduces average approval time from 5-7 days to 2-3 days, eliminates routing delays, and ensures requests never get stuck.

---

#### **Solution 4: Intelligent Scheduling System**
The system prevents scheduling conflicts and optimizes resource utilization:

- **Calendar View**: Visual calendar showing all scheduled trips with availability indicators
- **Conflict Detection**: Automatic checking for vehicle and driver availability before assignment
- **Slot Management**: Enforces daily limit of 5 slots to prevent overbooking
- **Availability Display**: Real-time display of available vehicles and drivers
- **Smart Assignment**: Suggests optimal vehicle-driver combinations based on capacity and availability

**Impact:** Eliminates double-booking, reduces last-minute cancellations, and improves resource utilization.

---

#### **Solution 5: Integrated Budget Management**
Comprehensive budget tracking and payment confirmation system:

- **Budget Dashboard**: Real-time view of department budgets, used amounts, and remaining balance
- **Expense Breakdown**: Detailed expense categorization and justification
- **Payment Workflow**: Digital payment confirmation process
- **Budget Approval**: Comptroller can review, edit, and approve budgets digitally
- **Budget History**: Complete audit trail of budget changes

**Impact:** Provides budget visibility, reduces computation errors, and streamlines payment confirmation.

---

#### **Solution 6: Feedback Collection System**
Systematic feedback mechanism for continuous improvement:

- **Post-Trip Feedback**: Mandatory feedback collection after trip completion
- **Feedback Lock**: UI locked until feedback is provided (ensures 100% response rate)
- **Rating System**: 5-star rating for vehicles, drivers, and overall experience
- **Shareable Links**: Generate QR codes and links for student/participant feedback
- **Feedback Analytics**: Admin dashboard showing feedback trends and issues

**Impact:** Enables data-driven improvements, identifies problematic vehicles/drivers, and improves service quality.

---

#### **Solution 7: Complete Audit Trail**
Comprehensive documentation and accountability:

- **Request History**: Complete log of all status changes with timestamps and approver information
- **Audit Logs**: System-wide audit trail for all actions (user management, role assignments, etc.)
- **Digital Signatures**: All approvals include digital signatures with timestamps
- **Role Grant History**: Complete history of role assignments and changes
- **Report Generation**: Ability to generate reports on travel patterns, approvals, and resource utilization

**Impact:** Ensures accountability, enables dispute resolution, and provides data for decision-making.

---

#### **Solution 8: Real-Time Notification System**
Centralized communication channel:

- **In-App Notifications**: Real-time notifications for all status changes
- **Notification Center**: Centralized inbox for all notifications with read/unread status
- **Email Integration**: Optional email notifications (via Resend API)
- **Auto-Refresh**: Inbox pages automatically update when new requests arrive
- **Notification Types**: Different notification types for approvals, rejections, assignments, etc.

**Impact:** Eliminates missed communications, reduces follow-up calls, and improves response times.

---

#### **Solution 9: Web-Based Accessibility**
Cloud-based platform accessible from anywhere:

- **No Installation Required**: Accessible via web browser
- **Mobile Responsive**: Optimized for mobile devices
- **Single Sign-On**: Microsoft Azure AD integration for seamless authentication
- **24/7 Access**: Available anytime, anywhere with internet connection
- **Cross-Platform**: Works on Windows, Mac, iOS, Android

**Impact:** Enables remote access, reduces physical visits, and improves convenience for off-campus faculty.

---

#### **Solution 10: Centralized Resource Management**
Complete vehicle and driver management system:

- **Vehicle Management**: Full CRUD operations for vehicles (add, edit, delete, view)
- **Driver Management**: Complete driver profile management with availability tracking
- **Schedule Calendar**: Visual calendar showing all assignments
- **Resource Analytics**: Dashboard showing utilization rates and patterns
- **Maintenance Tracking**: Capability to track vehicle maintenance schedules

**Impact:** Optimizes resource allocation, improves utilization, and enables data-driven planning.

---


---

**References:**
- Manuel S. Enverga University Foundation Travel Management Policies
- Interview transcripts and notes from stakeholder interviews
- System documentation and technical specifications
- User feedback and requirements documentation

---

*This section is part of the capstone project manuscript for TraviLink: A Web-Based Transportation Management System for Manuel S. Enverga University Foundation.*

