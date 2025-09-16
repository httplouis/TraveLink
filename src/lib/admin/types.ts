// ---- Basic KPIs & chart points ----
export type KPI = { label: string; value: number | string; caption?: string };

export type TrendPoint = { date: string; count: number };

export type StatusPoint = {
  status: "Pending" | "Approved" | "Completed" | "Rejected";
  count: number;
};

// ---- Utilization / Trip logs ----
export type UtilizationPoint = { label: string; percent: number }; // e.g., per vehicle/dept

export type TripLogRow = {
  id: string;
  vehicle: string;
  driver: string;
  department: string;
  date: string;        // YYYY-MM-DD
  distanceKm: number;  // mock for now
};

// ---- Requests ----
export type RequestStatus = "Pending" | "Approved" | "Completed" | "Rejected";

export type RequestRow = {
  id: string;
  dept: "CCMS" | "HR" | "Registrar" | "Finance";
  purpose: string;
  date: string;                // YYYY-MM-DD (scheduled date)
  status: RequestStatus;
  requester?: string;
  vehicle?: string;
  driver?: string;

  // When the request was submitted/received (optional)
  receivedAt?: string;         // e.g., "2025-09-04 10:15 AM"
  createdAt?: string;          // ISO (used by mocks for sorting)
  updatedAt?: string;          // ISO
};

export type RequestsSummary = {
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
};

// ---- Filters / Paging ----
export type FilterState = {
  status: "All" | RequestStatus;
  dept: "All" | "CCMS" | "HR" | "Registrar" | "Finance";
  from?: string;
  to?: string;
  search: string;
  mode: "auto" | "apply";
};

export type Pagination = {
  page: number;      // 1-based
  pageSize: number;  // rows per page
  total: number;     // total filtered rows
};

// ---- Dashboard aggregates ----
export type DeptUsage = { dept: string; count: number };

export type DashboardData = {
  kpis: KPI[];
  requestsByDay: TrendPoint[];
  statusBreakdown: StatusPoint[];
  utilization: UtilizationPoint[];
  deptUsage: DeptUsage[];
  recentRequests: RequestRow[];
  recentTrips: TripLogRow[];
  receivedAt?: string;
};
