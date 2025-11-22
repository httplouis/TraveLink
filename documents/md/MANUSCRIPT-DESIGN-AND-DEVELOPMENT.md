# Results and Discussion

## 7.4 Design and Developed System

This section presents the developed features and functionalities of TraviLink, demonstrating how the design and development phases materialized into a fully functional application that addresses the identified requirements and needs of the university's travel order and seminar application management system.

---

### 7.4.1 Authentication and User Management

The system provides secure access control using Supabase Auth with university email validation. Users must authenticate using their official university email accounts (@mseuf.edu.ph), ensuring that only authorized personnel can access the system. The system implements a comprehensive role-based access control (RBAC) system supporting multiple user roles: Faculty, Department Head, Administrator, Comptroller, HR Personnel, Vice President, President, and Driver. Each role has specific permissions and access levels, ensuring that users can only perform actions appropriate to their position in the organization hierarchy.

*[Figure 7.4.1: Login Page Interface]*

---

### 7.4.2 Request Creation and Management

The system provides comprehensive interfaces for creating travel orders and seminar applications. The Travel Order creation form includes intelligent auto-population features, such as pre-filling the request date and automatically populating department information based on the user's role. The form supports draft saving and direct submission. The Seminar Application form is a specialized interface designed for seminar and training requests, including fields for training category, modality, sponsor information, venue details, and expense breakdown. The system supports three vehicle modes: Institutional, Owned, and Rent, with intelligent vehicle filtering based on coding day restrictions.

*[Figure 7.4.2: Travel Order Creation Form]*
*[Figure 7.4.3: Seminar Application Form]*

---

### 7.4.3 Multi-User Collaboration System

The system supports multi-requester invitations and multi-department head endorsements. The main requester can invite additional faculty members to join a travel order through a searchable user selection interface. Invited users receive email notifications with secure confirmation links and can provide digital signatures. When a request includes requesters from multiple departments, the system automatically detects the unique departments involved and sends endorsement invitations to the appropriate department heads. All confirmations and endorsements are tracked in real-time.

*[Figure 7.4.4: Requester Invitation Interface]*
*[Figure 7.4.5: Head Endorsement Confirmation]*

---

### 7.4.4 Intelligent Workflow Automation and Approval System

The workflow engine intelligently determines the approval path based on request characteristics such as budget amount, requester role, and department structure. The system automatically routes requests through the appropriate approval chain: Department Head → Administrator → Comptroller (if budget exists) → HR → VP/President. Each approver role has a customized interface tailored to their specific responsibilities. Administrators can assign drivers and vehicles to approved requests, with conflict detection to prevent double-booking. The system provides a visual status tracker showing the current position of a request in the approval workflow.

*[Figure 7.4.6: Request Status Tracker]*
*[Figure 7.4.7: Approval Interface]*

---

### 7.4.5 Dashboard, Tracking, and Management Features

The system provides role-based dashboards showing relevant requests and actions for each user type. Users can view their requests, track status in real-time, search and filter requests, and manage attachments. The system includes comprehensive request details view with tabs for Details and Timeline, showing complete approval history with timestamps. The system supports file attachments, PDF generation for travel orders and seminar applications, and real-time status updates through polling mechanisms. The entire system is designed with mobile-first principles, ensuring optimal user experience across all device types.

*[Figure 7.4.8: User Dashboard]*
*[Figure 7.4.9: Request Details View]*

---

### 7.4.6 Summary

The TraviLink system encompasses a comprehensive set of features designed to streamline and automate the travel order and seminar application management process. The system successfully addresses the identified user needs through user-friendly interfaces, workflow automation, multi-user collaboration, resource management, comprehensive tracking, document management, real-time updates, mobile accessibility, and robust security features.

---

*This section is part of the capstone project manuscript for TraviLink: A Web-Based Transportation Management System for Manuel S. Enverga University Foundation.*
