// src/lib/org/departments.ts

/** -----------------------------
 *  Academic Departments
 *  ----------------------------- */
export const ACADEMIC_DEPARTMENTS = [
  "College of Computing and Multimedia Studies (CCMS)",
  "College of Criminal Justice and Criminology (CCJC)",
  "College of Nursing and Allied Health Sciences (CNAHS)",
  "College of International Hospitality and Tourism Management (CIHTM)",
  "College of Architecture and Fine Arts (CAFA)",
  "College of Maritime Education (CME)",
  "College of Business and Accountancy (CBA)",
  "College of Arts and Sciences (CAS)",
  "College of Education (CED)",
  "College of Engineering (CENG)",
  "Enverga Law School (ELS)",
  "Institute of Graduate Studies and Research (IGSR)",
  "Basic Education Department (BED)",
] as const;

/** -----------------------------
 *  Offices (long canonical list)
 *  (We keep this as the “authoritative” order.)
 *  ----------------------------- */
const OFFICES_LONG = [
  "Accounting Department (AD)",
  "Admission Office (AO)",
  "Auditing Department (AuD)",
  "Community Relations Department (CRD)",
  "Corporate Planning and Development Office (CPDO)",
  "Data Protection Office (DPO)",
  "Dr. Cesar A. Villariba Research & Knowledgement Management Institute (DCAVRKMI)",
  "General Services Department (GSD)",
  "Global Engagement Office (GEO)",
  "Health, Safety and Auxiliary Services Department (HSASD)",
  "Human Resource Department (HRD)",
  "Information & Communications Technology Department (ICTD)",
  "Institutional Marketing and Promotions (IMP)",
  "Learning Development Center (LDC)",
  "Legal Office (LO)",
  "Medical and Dental Services (MDS)",
  "MSEUF International Student Hub (MISH)", // <- corrected per your note
  "Office of Quality Improvement (OQI)",
  "Office of Scholarship & Endowmen, Job Placement, and Alumni Relations (OSEJPAR)",
  "Office of Sports & Cultural Relations (OSCR)",
  "Office of Student Affairs & Services (OSAS)",
  "Office of the Chairman/CEO (OCEO)",
  "Office of the Comptroller (OC)", // <- corrected from “OOffice…”
  "Office of the President/COO (OPCOO)", // <- corrected from “Offfice…”
  "Office of the Vice President for Academics and Research (OVPAR)",
  "Office of the Vice President for Administration (OVPA)", // <- corrected wording
  "Office of the Vice President for External Relations (OVPER)",
  "Office of the Vice President for Finance (OVPF)",
  "Pollution Control Office (PCO)",
  "Procurement Office (PO)",
  "Property Office (PropO)",
  "Registrar's Office (RO)",
  "Research Publication, Incubation, and Utilization Center (RPIUC)",
  "Treasury Department (TD)",
  "University Collegiate Student Council (UCSC)",
  "University Laboratories (UL)",
  "University Libraries (ULib)",
  "Web Content and Digital Engagement Office (WCDEO)",
] as const;

/** -----------------------------
 *  Offices (short additions/aliases)
 *  (These are merged & deduped into OFFICES.)
 *  ----------------------------- */
const OFFICES_SHORT = [
  "Treasury Office",
  "Alumni Affairs Office",
  "Registrar",
  "Human Resources",
  "Finance Office",
] as const;

/** -----------------------------
 *  Final OFFICES export
 *  (deduped union; preserves OFFICES_LONG order first)
 *  ----------------------------- */
export const OFFICES: string[] = [
  ...OFFICES_LONG,
  // add any short entries that aren't already present in the long list
  ...OFFICES_SHORT.filter((x) => !OFFICES_LONG.includes(x as any)),
];

/** -----------------------------
 *  Unified list (flat dropdown convenience)
 *  ----------------------------- */
export const DEPARTMENTS: string[] = [
  ...ACADEMIC_DEPARTMENTS,
  ...OFFICES,
];

/** -----------------------------
 *  Department → Head mapping (DEPRECATED - DO NOT USE)
 *  ⚠️ WARNING: This hardcoded mapping is DEPRECATED and should NOT be used.
 *  The system ALWAYS queries the database from the `users` table (where is_head=true or role='head').
 *  This mapping is kept only for reference and will be removed in a future version.
 *  ----------------------------- */
export const DEPARTMENT_HEADS: Record<string, string> = {
  // ⚠️ DEPRECATED - All department heads are now fetched from the database
  // This data is kept for reference only and is NOT used by the system
  // To update department heads, modify the users table in the database, not this file
};

/** -----------------------------
 *  Helper: get the head for a department (DEPRECATED)
 *  ⚠️ WARNING: This function is DEPRECATED and returns empty string.
 *  Always use the API endpoint `/api/approvers?role=head&department_id=<id>` instead.
 *  ----------------------------- */
export function getDepartmentHead(dept: string): string {
  console.warn(`[DEPRECATED] getDepartmentHead() called for "${dept}" - This function is deprecated. Use /api/approvers?role=head&department_id=<id> instead.`);
  return ""; // Always return empty - force usage of database API
}
