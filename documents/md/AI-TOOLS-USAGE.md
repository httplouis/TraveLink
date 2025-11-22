# AI Tools Usage Documentation

## AI Tools Used in the Development of TraviLink

### (1) ChatGPT

#### Descriptions of how the information was generated

ChatGPT was utilized as a research assistant and brainstorming tool to help clarify concepts, understand relationships between research articles, and generate initial ideas for the system architecture. The tool was used primarily during the literature review phase and for technical clarification purposes.

---

#### Prompts Used

**Prompt 1: Literature Review Assistance**
```
"Help me understand the relationship between these research articles on transportation management systems:
1. Smart transportation systems for universities
2. Web-based approval workflow systems
3. Real-time tracking technologies

How are these topics related, and what gaps exist in current research that a university transportation management system could address?"
```

**Prompt 2: System Architecture Clarification**
```
"Explain the differences between client-side routing and server-side rendering in Next.js, and which approach would be better for a multi-user approval workflow system where real-time updates are important. Provide examples of when to use each approach."
```

**Prompt 3: Database Design Consultation**
```
"I'm designing a database schema for a travel request management system with the following requirements:
- Multi-stage approval workflow (Department Head → Admin → Comptroller → HR → Executive)
- Support for multiple requesters per request
- Real-time status tracking
- Audit trail for all actions

What are the key tables and relationships I should consider? What are potential challenges with concurrent approvals?"
```

**Prompt 4: Technology Stack Validation**
```
"Compare Supabase vs Firebase for a Next.js application that needs:
- PostgreSQL database
- Authentication with email verification
- Real-time subscriptions
- File storage
- Row-level security

What are the pros and cons of each, and which would be more suitable for an academic project?"
```

**Prompt 5: Workflow Logic Clarification**
```
"Help me understand state machine patterns for approval workflows. I have a request that can be in states: draft, pending_head, pending_admin, pending_comptroller, pending_hr, pending_exec, approved, rejected, cancelled. 

What are the valid state transitions, and how should I handle edge cases like:
- A request being cancelled while in approval
- Multiple approvers at the same level
- Conditional routing based on request attributes (budget amount, requester role)"
```

---

#### Descriptions of how the output was used in your work

**Literature Review (Prompt 1):**
The output from ChatGPT helped identify key themes and relationships between different research areas. The insights were used to structure the Review of Related Literature (RRL) section, ensuring that the connections between transportation management, workflow automation, and real-time tracking technologies were clearly articulated. The identified research gaps informed the problem statement and justification for developing TraviLink.

**System Architecture Decisions (Prompt 2):**
The explanation of Next.js routing strategies helped the development team understand when to use Server Components vs Client Components. This knowledge was applied when designing the approval workflow interfaces, where server-side rendering was used for initial data loading, and client-side components were used for real-time updates and interactive elements.

**Database Schema Design (Prompt 3):**
The suggested database structure and relationship patterns were reviewed and adapted to fit the specific requirements of TraviLink. The recommendations influenced the design of the `requests`, `approvals`, `request_history`, and `notifications` tables. However, the final schema was customized based on actual system requirements and testing, not directly copied from the AI output.

**Technology Selection (Prompt 4):**
The comparison between Supabase and Firebase provided a starting point for technology evaluation. The team conducted additional research, reviewed documentation, and tested both platforms before ultimately choosing Supabase. The AI output served as an initial reference but was not the sole basis for the decision.

**Workflow Implementation (Prompt 5):**
The state machine pattern explanation helped conceptualize the approval workflow logic. The development team used these concepts as a foundation but implemented a custom `WorkflowEngine` class tailored to TraviLink's specific business rules, including parent department routing, budget-based routing, and executive-level determination.

---

## Usage Guidelines and Limitations

### Appropriate Use
- ✅ Research assistance and literature review organization
- ✅ Technical concept clarification and learning
- ✅ Initial brainstorming and idea generation
- ✅ Code pattern explanations and best practices
- ✅ Technology comparison and evaluation

### Not Used For
- ❌ Direct code generation (all code was written by the development team)
- ❌ Complete content generation (all manuscript content was written by the authors)
- ❌ Final decision-making (AI suggestions were evaluated and validated)
- ❌ Automated testing or quality assurance

---

## Verification and Validation

All AI-generated information was:
1. **Reviewed** by the development team for accuracy
2. **Validated** against official documentation and best practices
3. **Tested** through actual implementation
4. **Customized** to fit the specific requirements of TraviLink
5. **Documented** in the system documentation and code comments

---

## Summary

ChatGPT was used as a supplementary research and learning tool, primarily during the early stages of the project for literature review organization and technical concept clarification. All final decisions, implementations, and content were created by the development team through research, testing, and iterative development. The AI tool served as a starting point for exploration but did not replace critical thinking, validation, or hands-on development work.

