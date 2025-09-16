import type {
  DashboardData,
  RequestRow,
  TripLogRow,
  StatusPoint,
  KPI,
  UtilizationPoint,
  DeptUsage,
} from "../types";
import type { ListRequestsQuery } from "../repo";

/* ---------------- Mock dataset ---------------- */

let REQUESTS: RequestRow[] = [
  {
    id: "REQ-1001",
    dept: "CCMS",
    purpose: "Seminar",
    date: "2025-09-10",
    status: "Pending",
    requester: "Prof. Santos",
    createdAt: "2025-09-05T08:30:00Z",
    updatedAt: "2025-09-05T08:30:00Z",
  },
  {
    id: "REQ-1002",
    dept: "HR",
    purpose: "Orientation",
    date: "2025-09-12",
    status: "Approved",
    requester: "HR Office",
    createdAt: "2025-09-06T09:00:00Z",
    updatedAt: "2025-09-07T12:10:00Z",
  },
  {
    id: "REQ-1003",
    dept: "Finance",
    purpose: "Field Audit",
    date: "2025-09-14",
    status: "Rejected",
    requester: "Finance Team",
    createdAt: "2025-09-07T07:45:00Z",
    updatedAt: "2025-09-08T10:22:00Z",
  },
];

const RECENT_TRIPS: TripLogRow[] = [
  {
    id: "TRP-2001",
    vehicle: "VAN-12",
    driver: "Dizon",
    department: "CCMS",
    date: "2025-09-09",
    distanceKm: 12.6,
  },
  {
    id: "TRP-2002",
    vehicle: "VAN-03",
    driver: "Reyes",
    department: "HR",
    date: "2025-09-10",
    distanceKm: 7.8,
  },
];

/* ---------------- Helpers ---------------- */

function contains(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function inDateRange(d: string, from?: string, to?: string) {
  const t = new Date(d).getTime();
  if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to && t > new Date(to).setHours(23, 59, 59, 999)) return false;
  return true;
}

/* --------------- Dashboard --------------- */

export async function getDashboardData(): Promise<DashboardData> {
  const kpis: KPI[] = [
    { label: "Total Trips (Month)", value: 42 },
    { label: "Active Vehicles", value: 12 },
    { label: "Pending Requests", value: 5 },
    { label: "KM This Month", value: 1873 },
  ];

  const requestsByDay = [
    { date: "2025-09-08", count: 6 },
    { date: "2025-09-09", count: 8 },
    { date: "2025-09-10", count: 5 },
    { date: "2025-09-11", count: 10 },
    { date: "2025-09-12", count: 7 },
  ];

  const statusBreakdown: StatusPoint[] = [
    { status: "Pending", count: REQUESTS.filter(r => r.status === "Pending").length },
    { status: "Approved", count: REQUESTS.filter(r => r.status === "Approved").length },
    { status: "Completed", count: REQUESTS.filter(r => r.status === "Completed").length },
    { status: "Rejected", count: REQUESTS.filter(r => r.status === "Rejected").length },
  ];

  const utilization: UtilizationPoint[] = [
    { label: "VAN-12", percent: 76 },
    { label: "VAN-03", percent: 58 },
    { label: "BUS-01", percent: 42 },
  ];

  const deptUsage: DeptUsage[] = [
    { dept: "CCMS", count: 11 },
    { dept: "HR", count: 7 },
    { dept: "Registrar", count: 4 },
    { dept: "Finance", count: 5 },
  ];

  const recentRequests = REQUESTS.slice(0, 5);
  const recentTrips = RECENT_TRIPS;

  return {
    kpis,
    requestsByDay,
    statusBreakdown,
    utilization,
    deptUsage,
    recentRequests,
    recentTrips,
    receivedAt: new Date().toISOString(),
  };
}

/* ---------------- Requests ---------------- */

export async function listRequests(
  query: ListRequestsQuery
): Promise<{ rows: RequestRow[]; total: number }> {
  const { status, dept, search, from, to, page = 1, pageSize = 10 } = query ?? {};

  let rows = REQUESTS.slice();

  if (status && status !== "All") rows = rows.filter((r) => r.status === status);
  if (dept && dept !== "All") rows = rows.filter((r) => r.dept === dept);
  if (from || to) rows = rows.filter((r) => inDateRange(r.date, from, to));
  if (search && search.trim()) {
    rows = rows.filter(
      (r) =>
        contains(r.id, search) ||
        contains(r.purpose, search) ||
        contains(r.dept, search) ||
        contains(r.requester ?? "", search)
    );
  }

  // newest first by scheduled 'date', fallback to createdAt
  rows.sort((a, b) => {
    const A = new Date(a.date ?? a.createdAt ?? 0).getTime();
    const B = new Date(b.date ?? b.createdAt ?? 0).getTime();
    return B - A;
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return { rows: paged, total };
}

export async function getRequest(id: string): Promise<RequestRow> {
  const row = REQUESTS.find((r) => r.id === id);
  if (!row) throw new Error(`Request ${id} not found`);
  return row;
}

export async function updateRequest(
  id: string,
  patch: Partial<RequestRow>
): Promise<RequestRow> {
  const idx = REQUESTS.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Request ${id} not found`);
  REQUESTS[idx] = { ...REQUESTS[idx], ...patch, updatedAt: new Date().toISOString() };
  return REQUESTS[idx];
}

export async function bulkUpdate(ids: string[], patch: Partial<RequestRow>): Promise<void> {
  const now = new Date().toISOString();
  REQUESTS = REQUESTS.map((r) => (ids.includes(r.id) ? { ...r, ...patch, updatedAt: now } : r));
}
