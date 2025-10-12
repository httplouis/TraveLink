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
  "Accounting Department",
  "Admission Office",
  "Audting Department", // original spelling kept from your source list
  "Community Relations Department",
  "Corporate Planning and Development Office",
  "Data Protection Office",
  "Dr. Cesar A. Villariba Research & Knowledgement Management Institute",
  "General Services Department",
  "Global Engagement Office",
  "Health, Safety and Auxiliary Services Department",
  "Human Resource Department",
  "Information & Communications Technology Department",
  "Institutional Marketing and Promotions",
  "Learning Development Center",
  "Legal Office",
  "Medical and Dental Services",
  "MSEUF International Student Hub", // <- corrected per your note
  "Office of Quality Improvement",
  "Office of Scholarship & Endowmen, Job Placement, and Alumni Relations",
  "Office of Sports & Cultural Relations",
  "Office of Student Affairs & Services",
  "Office of the Chairman/CEO",
  "Office of the Comptroller", // <- corrected from “OOffice…”
  "Office of the President/COO", // <- corrected from “Offfice…”
  "Office of the Vice President for Academics and Research",
  "Office of the Vice President for Administration", // <- corrected wording
  "Office of the Vice President for External Relations",
  "Office of the Vice President for Finance",
  "Pollution Control Office",
  "Procurement Office",
  "Property Office",
  "Registrar's Office",
  "Research Publication, Incubation, and Utilization Center",
  "Treasury Department",
  "University Collegiate Student Council",
  "University Laboratories",
  "University Libraries",
  "Web Content and Digital Engagement Office",
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
 *  Department → Head mapping (sample placeholders)
 *  You can replace these with the actual names later.
 *  ----------------------------- */
export const DEPARTMENT_HEADS: Record<string, string> = {
  // Academics (samples)
  "College of Computing and Multimedia Studies (CCMS)": "Dr. Aileen Santos",
  "College of Criminal Justice and Criminology (CCJC)": "Dean Roberto Cruz",
  "College of Nursing and Allied Health Sciences (CNAHS)": "Dr. Melissa Ramos",
  "College of International Hospitality and Tourism Management (CIHTM)": "Chef Arman Villanueva",
  "College of Architecture and Fine Arts (CAFA)": "Ar. Paolo Lopez",
  "College of Maritime Education (CME)": "Capt. Jerome Valdez",
  "College of Business and Accountancy (CBA)": "Prof. Henry Dizon",
  "College of Arts and Sciences (CAS)": "Dr. Regina Flores",
  "College of Education (CED)": "Dr. Celeste Aquino",
  "College of Engineering (CENG)": "Engr. Liza Ramos",
  "Enverga Law School (ELS)": "Atty. Miguel Santos",
  "Institute of Graduate Studies and Research (IGSR)": "Dr. Alvin Garcia",
  "Basic Education Department (BED)": "Mrs. Karen Bautista",

  // Offices (samples)
  "Accounting Department": "Ms. Paula Reyes",
  "Admission Office": "Ms. Tricia Gomez",
  "Audting Department": "Mr. Leo Castillo",
  "Community Relations Department": "Ms. Iya Morales",
  "Corporate Planning and Development Office": "Mr. Daniel Lim",
  "Data Protection Office": "Mr. Noel Sarmiento",
  "Dr. Cesar A. Villariba Research & Knowledgement Management Institute": "Dr. Cesar Villariba",
  "General Services Department": "Mr. Jason Uy",
  "Global Engagement Office": "Ms. Sofia Tan",
  "Health, Safety and Auxiliary Services Department": "Mr. Patrick Cruz",
  "Human Resource Department": "Ms. Lorna de la Cruz",
  "Information & Communications Technology Department": "Mr. Carlo Perez",
  "Institutional Marketing and Promotions": "Ms. Bea Robles",
  "Learning Development Center": "Ms. Andrea Soriano",
  "Legal Office": "Atty. Vivian Mendoza",
  "Medical and Dental Services": "Dr. Ramon Santos",
  "MSEUF International Student Hub": "Ms. Hannah Ocampo", // <- corrected per your note
  "Office of Quality Improvement": "Mr. Julius Navarro",
  "Office of Scholarship & Endowmen, Job Placement, and Alumni Relations": "Ms. Angela Ramos",
  "Office of Sports & Cultural Relations": "Mr. Marco Villoria",
  "Office of Student Affairs & Services": "Ms. Kristine Chavez",
  "Office of the Chairman/CEO": "Mr. Ernesto Enverga",
  "Office of the Comptroller": "Mr. Luis Fernandez",
  "Office of the President/COO": "Dr. Maria Enverga",
  "Office of the Vice President for Academics and Research": "Dr. Roselle Garcia",
  "Office of the Vice President for Administration": "Mr. Rene Garcia", // <- your correction
  "Office of the Vice President for External Relations": "Mr. Paolo Miranda",
  "Office of the Vice President for Finance": "Ms. Clarissa Lim",
  "Pollution Control Office": "Mr. Nathan Ong",
  "Procurement Office": "Ms. Faith Santos",
  "Property Office": "Mr. Jorge Dizon",
  "Registrar's Office": "Ms. Liza Manuel",
  "Research Publication, Incubation, and Utilization Center": "Dr. Helen Cruz",
  "Treasury Department": "Ms. Carmina Reyes",
  "University Collegiate Student Council": "Mr. Adrian Gomez",
  "University Laboratories": "Dr. Vincent Tan",
  "University Libraries": "Ms. Teresa Mariano",
  "Web Content and Digital Engagement Office": "Ms. Jamie Uy",

  // Short/alias offices
  "Treasury Office": "Ms. Carmina Reyes",
  "Alumni Affairs Office": "Ms. Angela Ramos",
  "Registrar": "Ms. Liza Manuel",
  "Human Resources": "Ms. Lorna de la Cruz",
  "Finance Office": "Ms. Clarissa Lim",
};

/** -----------------------------
 *  Helper: get the head for a department
 *  ----------------------------- */
export function getDepartmentHead(dept: string): string {
  return DEPARTMENT_HEADS[dept] ?? "";
}
