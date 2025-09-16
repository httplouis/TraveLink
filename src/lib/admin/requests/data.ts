import type {
  RequestRow,
  TripLogRow,
  DashboardData,
} from "@/lib/admin/types";

/** Mock Requests used by Admin Requests page (safe to remove once connected to API) */
export const REQUESTS: RequestRow[] = [
  {
    id: "RQ-1021",
    dept: "CCMS",
    purpose: "Seminar",
    date: "2025-09-10",
    status: "Pending",
    requester: "Prof. Santos",
    vehicle: "Van 12",
    driver: "Dela Cruz",
    receivedAt: "2025-09-04 10:15 AM",
  },
  {
    id: "RQ-1019",
    dept: "HR",
    purpose: "Orientation",
    date: "2025-09-12",
    status: "Approved",
    requester: "HR Office",
    vehicle: "Bus 07",
    driver: "S. Reyes",
    receivedAt: "2025-09-05 3:40 PM",
  },
  {
    id: "RQ-1017",
    dept: "Registrar",
    purpose: "Enrollment Support",
    date: "2025-09-08",
    status: "Completed",
    requester: "Registrar",
    vehicle: "Car 05",
    driver: "A. Cruz",
    receivedAt: "2025-09-03 8:50 AM",
  },
  {
    id: "RQ-1016",
    dept: "Finance",
    purpose: "Audit Trip",
    date: "2025-09-09",
    status: "Rejected",
    requester: "Cashier",
    vehicle: "Van 03",
    driver: "B. Santos",
    receivedAt: "2025-09-04 11:20 AM",
  },
  {
    id: "RQ-1015",
    dept: "CCMS",
    purpose: "Training",
    date: "2025-09-06",
    status: "Approved",
    requester: "Dept Chair",
    vehicle: "Van 15",
    driver: "K. Dizon",
    receivedAt: "2025-09-02 9:10 AM",
  },
  {
    id: "RQ-1014",
    dept: "Finance",
    purpose: "Document Delivery",
    date: "2025-09-05",
    status: "Pending",
    requester: "Treasury",
    vehicle: "Car 02",
    driver: "M. Cruz",
    receivedAt: "2025-09-01 1:45 PM",
  },
];

/** Mock Trip logs (optional for dashboard) */
export const TRIPS: TripLogRow[] = [
  {
    id: "TRIP-201",
    vehicle: "Bus 12",
    driver: "Dela Cruz",
    department: "CCMS",
    date: "2025-09-10",
    distanceKm: 12.4,
  },
  {
    id: "TRIP-202",
    vehicle: "Van 07",
    driver: "S. Reyes",
    department: "HR",
    date: "2025-09-12",
    distanceKm: 7.8,
  },
];

/** Example dashboard aggregate using the mocks above */
export const DASHBOARD_DATA: DashboardData = {
  kpis: [
    { label: "Pending Requests", value: REQUESTS.filter(r => r.status === "Pending").length },
    { label: "Approved", value: REQUESTS.filter(r => r.status === "Approved").length },
    { label: "Completed", value: REQUESTS.filter(r => r.status === "Completed").length },
    { label: "Rejected", value: REQUESTS.filter(r => r.status === "Rejected").length },
  ],
  requestsByDay: [
    { date: "2025-09-01", count: 1 },
    { date: "2025-09-02", count: 1 },
    { date: "2025-09-03", count: 1 },
    { date: "2025-09-04", count: 2 },
    { date: "2025-09-05", count: 2 },
    { date: "2025-09-06", count: 1 },
    { date: "2025-09-08", count: 1 },
    { date: "2025-09-09", count: 1 },
    { date: "2025-09-10", count: 1 },
    { date: "2025-09-12", count: 1 },
  ],
  statusBreakdown: [
    { status: "Pending", count: REQUESTS.filter(r => r.status === "Pending").length },
    { status: "Approved", count: REQUESTS.filter(r => r.status === "Approved").length },
    { status: "Completed", count: REQUESTS.filter(r => r.status === "Completed").length },
    { status: "Rejected", count: REQUESTS.filter(r => r.status === "Rejected").length },
  ],
  utilization: [
    { label: "Bus", percent: 35 },
    { label: "Van", percent: 50 },
    { label: "Car", percent: 15 },
  ],
  deptUsage: [
    { dept: "CCMS", count: REQUESTS.filter(r => r.dept === "CCMS").length },
    { dept: "HR", count: REQUESTS.filter(r => r.dept === "HR").length },
    { dept: "Registrar", count: REQUESTS.filter(r => r.dept === "Registrar").length },
    { dept: "Finance", count: REQUESTS.filter(r => r.dept === "Finance").length },
  ],
  recentRequests: REQUESTS.slice(0, 5),
  recentTrips: TRIPS,
};
