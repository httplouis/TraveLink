# Results and Discussion

## 7.2 Design of TraviLink

### 7.2.1 Designed Prototype of the System

The design process for TraviLink began with comprehensive prototyping and wireframing to ensure an intuitive user experience across all user roles. The design team utilized **Figma**, a collaborative design tool, to create detailed mockups and interactive prototypes.

#### **7.2.1.1 Figma Design Boards and Wireframe Development**

The design process was organized into **6 comprehensive Figma boards** to systematically cover all aspects of the system:

**Board 1: User Interface Components** - Design system components and reusable UI elements including button variants, status badges, form inputs, modal designs, card layouts, navigation components, and empty states.

**Board 2: User Portal Design** - Faculty/Staff user interface with dashboard layout, request submission wizard, schedule calendar view, submissions page, request history, and profile settings.

**Board 3: Admin Portal Design** - Administrative interface for request processing including admin dashboard with request queue, vehicle and driver management interfaces, request approval modals, schedule management calendar, and resource assignment interfaces.

**Board 4: Approval Workflow Design** - Approval interfaces for all roles including Department Head, Comptroller, HR, and Executive (VP/President) approval interfaces, plus request tracking timeline visualization.

**Board 5: Mobile Responsive Design** - Mobile and tablet adaptations with responsive breakpoints (Mobile: 320px-768px, Tablet: 768px-1024px), touch-optimized interactions, mobile navigation patterns, and simplified layouts for smaller screens.

**Board 6: Design System Documentation** - Complete design system reference including color palette with hex codes, typography scale and font families, spacing system, border radius specifications, shadow and elevation system, and animation specifications.

**Wireframe Development Process:** The wireframing process followed a structured approach: (1) Low-Fidelity Wireframes - initial sketches focusing on layout and information architecture; (2) Mid-Fidelity Wireframes - detailed wireframes with content placeholders and basic styling; (3) High-Fidelity Mockups - pixel-perfect designs with final colors, typography, and spacing; (4) Interactive Prototypes - clickable prototypes demonstrating user flows and interactions.

**Key Design Decisions:** Card-based layout for all request displays, modal-based actions for approval and review, progressive disclosure for complex information, and clear visual hierarchy between primary and secondary actions.

*[Figure 7.2.1.1: Figma Design Boards Overview]*
*[Figure 7.2.1.2: Wireframe Development Process]*

---

### 7.2.2 Design Theme, Color Palette, and Typography System

**University Brand Identity:** TraviLink's design theme is centered around **Manuel S. Enverga University Foundation's official brand colors** to maintain consistency with the institution's visual identity. The **Primary Color is University Maroon (#7A0010)**, representing tradition, excellence, and institutional identity. It is used for primary navigation elements, active states, primary action buttons, request number badges, and hover states. The maroon color conveys professionalism, trustworthiness, and institutional authority.

**Secondary Colors:** Slate Gray Palette is used for neutral content, backgrounds, and text (slate-50 for light backgrounds, slate-200 for borders, slate-600 for body text, slate-900 for headings). Amber/Gold is used for service preferences, suggestions, and informational elements. Status colors include Green (Success), Yellow/Amber (Warning), Red (Error), and Blue (Informational).

**Design Philosophy:** The design follows a "Professional Minimalism" philosophy emphasizing consistency (one primary maroon color), clarity (clean layouts with ample white space), hierarchy (clear visual hierarchy using typography, color, and spacing), accessibility (WCAG 2.1 Level AA compliance), and brand alignment (university colors create institutional trust).

**Typography System:** TraviLink uses **Inter (Variable Font)** as the primary font, specifically designed for user interfaces and digital screens. The font stack includes system fonts for optimal performance: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`. The typography scale follows a modular system: H1 (24px, 700 weight) for page titles, H2 (18px, 600 weight) for section titles, H3 (16px, 600 weight) for subsection titles, default body (14px, 500 weight) for primary content, secondary text (12px, 400 weight) for metadata, and small text (12px, 600 weight, uppercase) for labels and status indicators.

**Rationale for Design Choices:** (1) Institutional Identity - using university's official maroon reinforces official system status; (2) User Familiarity - faculty and staff are familiar with maroon from other university materials; (3) Professional Appearance - maroon with professional grays creates sophisticated, trustworthy interface; (4) Inter Font - optimized for screens with excellent readability and accessibility; (5) Variable Font Benefits - single file with multiple weights reduces bandwidth and improves performance.

*[Figure 7.2.2.1: Design Theme and Color Palette]*
*[Figure 7.2.2.2: Typography System]*

---

### 7.2.3 Operational Flow of the System

The operational flow of TraviLink is based on comprehensive UML diagrams that illustrate the complete workflow from request submission to final approval. The system implements an intelligent, multi-stage approval process that automatically routes requests through the appropriate approval chain based on request characteristics, requester role, and organizational hierarchy.

#### **7.2.3.1 Request Submission and Initial Routing**

The operational flow begins when a faculty or staff member creates a travel request. The system automatically determines the initial approval stage based on the requester's role. For faculty/staff requests, the system sets status to `pending_head` (awaiting department head approval), while head/director/dean requests skip head approval and go directly to `pending_admin` (Administrator). The system supports multi-requester invitations and multi-department head endorsements, automatically detecting unique departments and sending endorsement invitations to appropriate department heads.

*[Figure 7.2.3.1: Request Submission Activity Diagram]*

---

#### **7.2.3.2 Approval Workflow Stages and Routing Logic**

The system implements a comprehensive approval workflow with six main stages: (1) Department Head Approval - routes to parent head if department has parent, otherwise to Administrator; (2) Administrator Processing - assigns vehicle/driver and routes to Comptroller (if budget exists) or HR (if no budget); (3) Comptroller Budget Review - reviews budget, can send to requester for payment confirmation, then routes to HR; (4) HR Approval - routes based on requester type (Faculty+Head → VP only, Head/Director/Dean → President); (5) Executive Approval - VP for standard requests, President for head requests or high-value requests (>₱50,000); (6) Final Approval - triggers feedback notification and enables PDF generation. The system uses intelligent routing rules including parent department hierarchy detection, budget-based routing, executive level determination, and choice-based sending for approvers.

*[Figure 7.2.3.2: Approval Workflow Sequence Diagram]*
*[Figure 7.2.3.3: Workflow Scenarios Activity Diagram]*

---

#### **7.2.3.3 Workflow Scenarios and UML Diagrams**

The system implements different workflow scenarios based on UML activity diagrams: (1) Faculty Request with Budget: Faculty → Department Head → Parent Head (if exists) → Admin → Comptroller → HR → VP → Approved; (2) Faculty Request without Budget: Faculty → Department Head → Admin → HR → VP → Approved; (3) Head/Director/Dean Request: Head → Admin → Comptroller (if budget) → HR → President → Approved; (4) Faculty + Head Included: Faculty → Department Head → Admin → HR → VP → Approved (VP is final, no President needed). The operational flow is documented through UML diagrams including Activity Diagrams (overall process flow), Sequence Diagrams (interactions between components), State Machine Diagrams (status transitions), Use Case Diagrams (all use cases and actors), and Class Diagrams (system architecture). All status transitions are logged in the request_history table with timestamps, approver information, and digital signatures.

*[Figure 7.2.3.4: Request Status State Machine Diagram]*
*[Figure 7.2.3.5: Multi-User Collaboration Sequence Diagram]*
