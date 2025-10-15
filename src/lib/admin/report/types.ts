// src/lib/admin/report/types.ts

export type ReportStatus = "Pending" | "Approved" | "Completed" | "Rejected";

/** Full department labels as shown in your list */
export type DepartmentName =
  | "College of Computing and Multimedia Studies (CCMS)"
  | "College of Criminal Justice and Criminology (CCJC)"
  | "College of Nursing and Allied Health Sciences (CNAHS)"
  | "College of International Hospitality and Tourism Management (CIHTM)"
  | "College of Architecture and Fine Arts (CAFA)"
  | "College of Maritime Education (CME)"
  | "College of Business and Accountancy (CBA)"
  | "College of Arts and Sciences (CAS)"
  | "College of Education (CED)"
  | "College of Engineering (CENG)"
  | "Enverga Law School (ELS)"
  | "Institute of Graduate Studies and Research (IGSR)"
  | "Basic Education Department (BED)"
  | "Treasury Office"
  | "Alumni Affairs Office"
  | "Registrar"
  | "Human Resources"
  | "Finance Office";

/** Reusable list for dropdowns */
export const DEPARTMENTS: DepartmentName[] = [
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
  "Treasury Office",
  "Alumni Affairs Office",
  "Registrar",
  "Human Resources",
  "Finance Office",
];

export type TripRow = {
  id: string;
  department: DepartmentName; // updated
  purpose: string;
  date: string; // ISO
  status: ReportStatus;
  vehicleCode: string;
  driver: string;
  km: number;
};

export type ReportFilters = {
  search?: string;
  department?: DepartmentName | "";
  status?: ReportStatus | "";
  from?: string; // "YYYY-MM-DD"
  to?: string;   // "YYYY-MM-DD"
};

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};
