// Central source of truth for departments & offices used in registration, forms, etc.

export type OrgUnit = {
  id: string;
  name: string;
  type: "academic" | "office";
};

/** Academic departments (sample; extend as needed) */
export const ACADEMIC_DEPARTMENTS: OrgUnit[] = [
  
  { id: "cba",  name: "College of Business Administration (CBA)",           type: "academic" },
  { id: "coe",  name: "College of Engineering (COE)",                       type: "academic" },
  { id: "ccj",  name: "College of Criminal Justice (CCJ)",                  type: "academic" },
  { id: "chs",  name: "College of Health Sciences (CHS)",                   type: "academic" },
  { id: "cte",  name: "College of Teacher Education (CTE)",                 type: "academic" },
  { id: "cas",  name: "College of Arts and Sciences (CAS)",                 type: "academic" },
  { id: "shs",  name: "Senior High School (SHS)",                           type: "academic" },
];

/** Offices (your list; typos lightly normalized only for readability) */
export const OFFICES: OrgUnit[] = [
  { id: "acct", name: "Accounting Department", type: "office" },
  { id: "admission", name: "Admission Office", type: "office" },
  { id: "audit", name: "Auditing Department", type: "office" },
  { id: "comrel", name: "Community Relations Department", type: "office" },
  { id: "cpdo", name: "Corporate Planning and Development Office", type: "office" },
  { id: "dpo", name: "Data Protection Office", type: "office" },
  { id: "villariba-rkmi", name: "Dr. Cesar A. Villariba Research & Knowledge Management Institute", type: "office" },
  { id: "gsd", name: "General Services Department", type: "office" },
  { id: "geo", name: "Global Engagement Office", type: "office" },
  { id: "hsasd", name: "Health, Safety and Auxiliary Services Department", type: "office" },
  { id: "hrd", name: "Human Resource Department", type: "office" },
  { id: "ictd", name: "Information & Communications Technology Department", type: "office" },
  { id: "impo", name: "Institutional Marketing and Promotions", type: "office" },
  { id: "ldc", name: "Learning Development Center", type: "office" },
  { id: "legal", name: "Legal Office", type: "office" },
  { id: "meddent", name: "Medical and Dental Services", type: "office" },
  { id: "mseif-ish", name: "MSEIF International Student Hub", type: "office" },
  { id: "oqi", name: "Office of Quality Improvement", type: "office" },
  { id: "ose-jpa", name: "Office of Scholarship & Endowment, Job Placement, and Alumni Relations", type: "office" },
  { id: "oscr", name: "Office of Sports & Cultural Relations", type: "office" },
  { id: "ceo", name: "Office of the Chairman/CEO", type: "office" },
  { id: "comptroller", name: "Office of the Comptroller", type: "office" },
  { id: "president", name: "Office of the President/COO", type: "office" },
  { id: "vpar", name: "Office of the Vice President for Academics and Research", type: "office" },
  { id: "vpa", name: "Office of the Vice President for Administration", type: "office" },
  { id: "vper", name: "Office of the Vice President for External Relations", type: "office" },
  { id: "vpf", name: "Office of the Vice President for Finance", type: "office" },
  { id: "pco", name: "Pollution Control Office", type: "office" },
  { id: "proc", name: "Procurement Office", type: "office" },
  { id: "property", name: "Property Office", type: "office" },
  { id: "reg", name: "Registrar's Office", type: "office" },
  { id: "rpic", name: "Research Publication, Incubation, and Utilization Center", type: "office" },
  { id: "treasury", name: "Treasury Department", type: "office" },
  { id: "ucsc", name: "University Collegiate Student Council", type: "office" },
  { id: "labs", name: "University Laboratories", type: "office" },
  { id: "libs", name: "University Libraries", type: "office" },
  { id: "wcdeo", name: "Web Content and Digital Engagement Office", type: "office" },
];

/** Handy combined getters */
export const ALL_UNITS: OrgUnit[] = [...ACADEMIC_DEPARTMENTS, ...OFFICES];

export const toOptions = (units: OrgUnit[]) =>
  units.map(u => ({ value: u.name, label: u.name, type: u.type }));
