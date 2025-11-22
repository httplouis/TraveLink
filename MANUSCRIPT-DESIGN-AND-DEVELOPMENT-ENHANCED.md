# 4. Design and Developed System

This section presents the developed features and functionalities of TraviLink, demonstrating how the design and development phases materialized into a fully functional application that addresses the identified requirements and needs of the university's travel order and seminar application management system. The following subsections showcase the core features of the system including request creation, workflow automation, multi-user collaboration, administrative management, comprehensive tracking capabilities, and legal compliance features.

---

## 4.1 Authentication and User Management

### 4.1.1 Secure Login System

The authentication system provides secure access control using Supabase Auth with university email validation. Users must authenticate using their official university email accounts (@mseuf.edu.ph), ensuring that only authorized personnel can access the system. The login interface features a clean, user-friendly design with proper error handling for invalid credentials, expired sessions, and network issues.

**Key Features:**
- University email domain validation
- Microsoft account integration option
- Secure password authentication
- Session management with automatic token refresh
- Error handling for invalid credentials and expired sessions
- Responsive design for desktop and mobile devices
- Links to Privacy Policy and Terms of Service

*[Figure 4.1: Login Page Interface]*

### 4.1.2 Role-Based Access Control

The system implements a comprehensive role-based access control (RBAC) system supporting multiple user roles: Faculty, Department Head, Administrator, Comptroller, HR Personnel, Vice President, President, and Driver. Each role has specific permissions and access levels, ensuring that users can only perform actions appropriate to their position in the organization hierarchy.

**Key Features:**
- Multiple user roles with distinct permissions
- Dynamic UI based on user role
- Secure route protection
- Role-based dashboard views

---

## 4.2 Request Creation Module

### 4.2.1 Travel Order Creation

The Travel Order creation form provides a comprehensive interface for faculty and staff to submit travel requests. The form includes intelligent auto-population features, such as pre-filling the request date with today's date and automatically populating department information based on the user's role. The form supports both draft saving and direct submission, allowing users to work on requests incrementally.

**Key Features:**
- Comprehensive form with validation
- Auto-population of user and department information
- Date pre-filling for request date
- Draft saving functionality
- Real-time form validation
- Support for multiple requesters
- File attachment capability
- Budget breakdown section

*[Figure 4.2: Travel Order Creation Form]*

### 4.2.2 Seminar Application Creation

The Seminar Application form is a specialized interface designed for seminar and training requests. It includes fields for training category, modality, sponsor information, venue details, expense breakdown, and applicant management. The system automatically calculates total expenses by summing registration fees and breakdown items, providing real-time budget calculations.

**Key Features:**
- Specialized form for seminar applications
- Training category and modality selection
- Multiple applicant management
- FDP (Faculty Development Program) tracking
- Automatic expense calculation
- Make-up class schedule documentation
- Applicant undertaking acknowledgment

*[Figure 4.3: Seminar Application Form]*

### 4.2.3 Vehicle Mode Selection and School Service Preferences

The system supports three vehicle modes: Institutional, Owned, and Rent. When "Institutional" is selected, the School Service section appears, allowing users to suggest preferred drivers and vehicles. The vehicle selection dropdown intelligently filters vehicles based on coding day restrictions, ensuring only available vehicles are shown for the selected travel date.

**Key Features:**
- Three vehicle mode options (Institutional, Owned, Rent)
- Automatic vehicle mode locking for educational/seminar requests
- Preferred driver and vehicle suggestion
- Coding day-based vehicle filtering
- Cost justification for rent vehicles
- Real-time driver and vehicle availability from database

*[Figure 4.4: School Service Preferences Section]*

---

## 4.3 Multi-Requester Invitation System

### 4.3.1 Requester Invitation Interface

The system allows the main requester to invite additional faculty members to join a travel order. The invitation interface features a searchable user selection component that enables real-time user search, displaying matching users as the requester types. Invited users receive email notifications with secure confirmation links.

**Key Features:**
- Searchable user selection with real-time search
- Email invitation system
- Secure token-based confirmation links
- Mobile-responsive confirmation pages
- Real-time invitation status tracking

*[Figure 4.5: Requester Invitation Interface]*

### 4.3.2 Invitation Confirmation and Signature Capture

Invited requesters receive email notifications containing secure confirmation links. Upon clicking the link, they are directed to a confirmation page displaying request details. The page includes a digital signature pad where requesters can provide their signature using touch or mouse input. The system supports both confirmation and declination options.

**Key Features:**
- Email-based invitation system
- Secure token validation
- Digital signature capture
- Request details preview
- Confirmation and declination options
- Mobile device compatibility

*[Figure 4.6: Invitation Confirmation Page with Signature Pad]*

### 4.3.3 Real-Time Status Updates

The main requester's form displays real-time updates of invitation statuses through polling mechanisms. When an invited requester confirms or declines, the status updates automatically without requiring a page refresh. Confirmed requesters are displayed with their signatures and confirmation timestamps.

**Key Features:**
- Real-time status polling
- Automatic UI updates
- Visual status indicators (Pending, Confirmed, Declined)
- Confirmed requester display with signatures

---

## 4.4 Multi-Department Head Endorsement System

### 4.4.1 Automatic Department Detection

When a request includes requesters from multiple departments, the system automatically detects the unique departments involved. If the main requester is a department head, their department is excluded from the endorsement requirement. The system then identifies the appropriate department heads for each unique department and sends endorsement invitations automatically.

**Key Features:**
- Automatic multi-department detection
- Smart exclusion of main requester's department
- Department head identification
- Automatic invitation generation

*[Figure 4.7: Head Endorsement Status Display]*

### 4.4.2 Head Endorsement Invitation and Confirmation

Department heads receive email invitations when their department's faculty members are included in requests from other departments. The invitation includes request details and a secure confirmation link. Heads can view the request, provide their digital signature, and confirm or decline the endorsement. The system tracks all required endorsements and prevents request submission until all necessary endorsements are confirmed.

**Key Features:**
- Email invitation to department heads
- Secure confirmation process
- Digital signature capture
- Multi-head endorsement tracking
- Submission blocking until all endorsements confirmed

*[Figure 4.8: Head Endorsement Confirmation Interface]*

---

## 4.5 Intelligent Workflow Automation

### 4.5.1 Smart Routing System

The workflow engine intelligently determines the approval path based on request characteristics. Factors such as budget amount, requester role, department structure, and request type automatically determine which approvers are required. The system can skip unnecessary approval stages (e.g., skipping comptroller for requests without budget) to streamline the process.

**Key Features:**
- Intelligent approval path determination
- Automatic stage skipping for efficiency
- Role-based routing
- Budget-based workflow branching
- Parent department head detection

*[Figure 4.9: Request Status Tracker Showing Workflow Stages]*

### 4.5.2 Approval Interface for Different Roles

Each approver role has a customized interface tailored to their specific responsibilities:

**Department Head Interface:**
- View request details
- Approve and route to Admin or VP
- Return request for changes
- View confirmed requesters and endorsements

**Administrator Interface:**
- Process requests
- Assign drivers and vehicles
- Add administrative notes
- Route to next approver

**Comptroller Interface:**
- Review budget breakdown
- Approve or reject budget
- Add budget-related comments

**HR Interface:**
- Review personnel-related aspects
- Approve or return requests

**VP/President Interface:**
- Review executive-level requests
- Final approval authority
- View complete request history

*[Figure 4.10: Department Head Approval Interface]*
*[Figure 4.11: Administrator Processing Interface]*

---

## 4.6 Driver and Vehicle Management

### 4.6.1 Driver Management System

The system maintains a comprehensive database of all drivers with their information including license details, availability status, and current assignments. Administrators can view all drivers, filter by availability, and see driver assignments across different requests. The driver list is fetched from the database in real-time, ensuring accurate and up-to-date information.

**Key Features:**
- Complete driver database (no mock data)
- Real-time availability tracking
- Assignment conflict detection
- Driver profile management
- Search and filter capabilities
- Integration with user management system

*[Figure 4.12: Driver Management Interface]*

### 4.6.2 Vehicle Management and Coding Day System

The vehicle management system tracks all institutional vehicles with their specifications, availability, and coding day restrictions. The system implements a coding day filter that automatically excludes vehicles unavailable on specific dates based on number coding restrictions. This ensures that only available vehicles are suggested or assigned for travel dates.

**Key Features:**
- Complete vehicle database
- Coding day restriction implementation
- Real-time availability filtering
- Vehicle assignment tracking
- Search and filter by type, capacity, and status

*[Figure 4.13: Vehicle Management Interface]*

### 4.6.3 Driver and Vehicle Assignment

Administrators can assign drivers and vehicles to approved requests through an intuitive interface. The system displays preferred driver and vehicle suggestions from the requester, but allows administrators to make the final assignment. Assignment conflicts are detected and displayed to prevent double-booking of resources.

**Key Features:**
- Assignment interface in request details
- Preferred driver/vehicle display
- Conflict detection and warnings
- Assignment history tracking
- Real-time availability updates

*[Figure 4.14: Driver and Vehicle Assignment Interface]*

---

## 4.7 Request Status Tracking and Visualization

### 4.7.1 Comprehensive Status Tracker

The system provides a visual status tracker that displays the current position of a request in the approval workflow. The tracker shows all stages (Head Approval, Admin Processing, Comptroller, HR, VP, President) with visual indicators for completed, current, and pending stages. Color-coded status badges provide immediate visual feedback on request status.

**Key Features:**
- Visual workflow progress indicator
- Stage-by-stage status display
- Color-coded status badges
- Timestamp tracking for each stage
- Approver information display

*[Figure 4.15: Request Status Tracker Component]*

### 4.7.2 Request Details View

The request details view provides a comprehensive display of all request information organized in tabs (Details and Timeline). The Details tab shows all request information including basic details, budget breakdown, transportation arrangements, participants, and attachments. The Timeline tab displays the complete approval history with timestamps and approver information.

**Key Features:**
- Tabbed interface (Details/Timeline)
- Complete request information display
- Confirmed requesters with signatures
- Routing information display
- Attachment viewing and downloading
- PDF generation option

*[Figure 4.16: Request Details View - Details Tab]*
*[Figure 4.17: Request Details View - Timeline Tab]*

---

## 4.8 Dashboard and Request Management Views

### 4.8.1 User Dashboard

Each user role has a customized dashboard showing relevant requests and actions:

**Faculty/Staff Dashboard:**
- My Requests list with status filters
- Quick access to create new request
- Pending invitation notifications
- Request statistics

**Department Head Dashboard:**
- Pending approvals list
- Department request overview
- Approval statistics
- Quick action buttons

**Administrator Dashboard:**
- Processing queue
- Assignment management
- System statistics
- Resource management tools

*[Figure 4.18: Faculty Dashboard View]*
*[Figure 4.19: Department Head Dashboard View]*

### 4.8.2 Request List Views

The system provides various list views for different purposes:

**My Requests View:**
- All requests created by the user
- Status-based filtering
- Search functionality
- Quick actions (View, Edit, Delete draft)

**Pending Approvals View:**
- Requests awaiting user's approval
- Sorted by submission date
- Quick preview and action buttons

**All Requests View (Admin):**
- Complete request database
- Advanced filtering options
- Bulk operations
- Export capabilities

**Key Features:**
- Status-based filtering
- Search by request number, destination, requester
- Date range filtering
- Department filtering
- Sortable columns
- Pagination for large datasets

*[Figure 4.20: Request List View with Filters]*

---

## 4.9 File Management and Attachments

### 4.9.1 File Upload System

The system supports file attachments for requests, allowing users to upload supporting documents such as invitations, schedules, or other relevant materials. The upload interface supports multiple file types with size validation and provides visual feedback during upload.

**Key Features:**
- Multiple file upload support
- File type validation
- Size limit enforcement
- Upload progress indicators
- File preview capabilities

*[Figure 4.21: File Attachment Interface]*

### 4.9.2 Attachment Management

Attachments can be viewed, downloaded, and managed through the request details interface. Administrators with edit permissions can add or remove attachments even after request submission, providing flexibility for document management.

**Key Features:**
- Attachment viewing and downloading
- Edit capabilities for authorized users
- File metadata display (name, size, upload date)
- Secure file access through RLS policies

---

## 4.10 PDF Generation and Export

### 4.10.1 Travel Order PDF Generation

The system generates professional PDF documents for travel orders that match official document standards. The PDF includes all request details, requester information, travel details, budget breakdown, assigned resources, and digital signatures from all approvers.

**Key Features:**
- Professional document formatting
- Complete request information
- Digital signature inclusion
- Official document appearance
- Downloadable PDF format

*[Figure 4.22: Generated Travel Order PDF Preview]*

### 4.10.2 Seminar Application PDF Generation

Seminar applications are exported to PDF format with specialized layout including applicant information, training details, expense breakdown, and required signatures. The PDF serves as the official application document for submission to relevant offices.

**Key Features:**
- Specialized seminar PDF layout
- Applicant list with signatures
- Expense breakdown table
- Training details section
- Official formatting

---

## 4.11 Search and Filter Capabilities

### 4.11.1 Advanced Search Functionality

The system provides comprehensive search capabilities across requests, allowing users to search by request number, destination, requester name, department, or any text content within requests. The search is real-time and provides instant results as the user types.

**Key Features:**
- Multi-field search
- Real-time search results
- Search highlighting
- Search history
- Advanced search options

### 4.11.2 Filtering System

Multiple filtering options enable users to narrow down request lists:

- **Status Filtering**: Filter by request status (Draft, Pending, Approved, etc.)
- **Date Range Filtering**: Filter requests by submission date or travel date range
- **Department Filtering**: View requests from specific departments
- **Requester Filtering**: Filter by specific requester
- **Budget Range Filtering**: Filter requests by budget amount
- **Combined Filters**: Apply multiple filters simultaneously

**Key Features:**
- Multiple filter types
- Filter combination support
- Filter persistence
- Clear all filters option
- Filter result count display

*[Figure 4.23: Advanced Search and Filter Interface]*

---

## 4.12 Real-Time Updates and Notifications

### 4.12.1 Email Notification System

The system sends email notifications for various events:

- **Invitation Notifications**: When requesters or department heads are invited
- **Status Change Notifications**: When request status changes
- **Approval Notifications**: When requests are approved or returned
- **Assignment Notifications**: When drivers/vehicles are assigned

**Key Features:**
- Automated email sending
- Professional email templates
- Mobile-responsive email design
- Secure confirmation links
- Email delivery tracking
- Universal mobile compatibility (links work on all devices)

### 4.12.2 Real-Time Status Polling

The system implements polling mechanisms to provide real-time updates without requiring page refreshes. Status changes, invitation confirmations, and endorsement updates are reflected immediately in the user interface.

**Key Features:**
- Automatic status polling
- Real-time UI updates
- Visual status indicators
- Notification badges
- Update timestamps

---

## 4.13 Mobile Responsiveness and Cross-Platform Compatibility

### 4.13.1 Responsive Design

The entire system is designed with mobile-first principles, ensuring optimal user experience across all device types:

- **Desktop**: Full-featured interface with all capabilities
- **Tablet**: Optimized layout with touch-friendly controls
- **Mobile**: Streamlined interface with essential features

**Key Features:**
- Responsive layout using Tailwind CSS
- Touch-friendly interface elements
- Mobile-optimized forms
- Adaptive navigation
- Optimized image loading

*[Figure 4.24: Mobile View of Request Creation Form]*
*[Figure 4.25: Mobile View of Request Details]*

### 4.13.2 Cross-Browser Compatibility

The system is tested and optimized for all major browsers:

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari (Desktop and iOS)
- Mobile browsers (Chrome Mobile, Safari Mobile)

---

## 4.14 Security Features

### 4.14.1 Authentication Security

- University email domain validation
- Secure password hashing
- Session management with automatic expiration
- Token-based API authentication
- Protection against common attacks (XSS, CSRF)

### 4.14.2 Data Security

- Row Level Security (RLS) policies at database level
- Role-based access control
- Secure file storage with access controls
- Input validation and sanitization
- SQL injection prevention
- Secure API endpoints

### 4.14.3 Audit Trail

The system maintains comprehensive audit logs tracking:
- User actions and changes
- Approval decisions
- Status changes
- File uploads and modifications
- System access logs

---

## 4.15 Legal Compliance and Documentation

### 4.15.1 Privacy Policy

The system includes a comprehensive Privacy Policy page that complies with Republic Act No. 10173 (Data Privacy Act of the Philippines). The privacy policy covers:

**Key Sections:**
- Information collection and usage
- Data sharing and disclosure policies
- Security measures and data protection
- User rights under RA 10173
- Data retention policies
- Contact information for data protection officer
- Cookie and tracking information

**Key Features:**
- RA 10173 compliance
- Clear explanation of data practices
- User rights documentation
- Contact information for privacy concerns
- Regular policy updates

*[Figure 4.26: Privacy Policy Page]*

### 4.15.2 Terms of Service

The system includes a detailed Terms of Service page that outlines:

**Key Sections:**
- User eligibility and account requirements
- Acceptable use policies
- Request submission guidelines
- User roles and responsibilities
- Intellectual property rights
- Prohibited activities
- System availability and modifications
- Limitation of liability
- Termination policies
- Governing law (Philippines)

**Key Features:**
- Comprehensive terms coverage
- Clear user responsibilities
- University policy alignment
- Legal protection for the institution
- Accessible from login page

*[Figure 4.27: Terms of Service Page]*

### 4.15.3 Legal Document Integration

Both Privacy Policy and Terms of Service are:
- Accessible from the login page footer
- Linked from relevant system pages
- Regularly updated to reflect current practices
- Compliant with Philippine data protection laws
- Written in clear, understandable language

**Key Features:**
- Easy access from login interface
- Mobile-responsive legal pages
- Professional formatting
- Searchable content
- Print-friendly layout

---

## Summary

The TraviLink system encompasses a comprehensive set of features designed to streamline and automate the travel order and seminar application management process. The system successfully addresses the identified user needs through:

1. **User-Friendly Interfaces**: Intuitive forms and dashboards for all user roles
2. **Workflow Automation**: Intelligent routing and approval processes
3. **Multi-User Collaboration**: Invitation and endorsement systems
4. **Resource Management**: Driver and vehicle assignment capabilities with real database integration
5. **Comprehensive Tracking**: Status tracking and history management
6. **Document Management**: File attachments and PDF generation
7. **Real-Time Updates**: Live status updates and notifications
8. **Mobile Accessibility**: Responsive design for all devices
9. **Security**: Robust authentication and data protection
10. **Legal Compliance**: Privacy Policy and Terms of Service in compliance with RA 10173

Each feature has been developed with careful consideration of user requirements, ensuring that the system not only meets functional needs but also provides an excellent user experience across all user roles and device types. The system also maintains compliance with Philippine data protection laws and university policies through comprehensive legal documentation.

---

**Note for Figures:**
- All figure placeholders should be replaced with actual screenshots during manuscript preparation
- Screenshots should be high-resolution and clearly show the interface elements
- Consider including annotations or callouts to highlight key features
- Ensure consistent styling and formatting across all figures
- Include screenshots of Privacy Policy and Terms of Service pages

