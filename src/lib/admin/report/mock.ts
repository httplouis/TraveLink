import type { TripRow } from "./types";

const d = {
  CCMS: "College of Computing and Multimedia Studies (CCMS)",
  FIN: "Finance Office",
  HR: "Human Resources",
  REG: "Registrar",
} as const;

const make = (p: Partial<TripRow>, i: number): TripRow => ({
  id: `T-${1000 + i}`,
  department: d.CCMS,
  purpose: "Faculty transport",
  date: "2025-09-12",
  status: "Approved",
  vehicleCode: "VAN-12",
  driver: "Dela Cruz",
  km: 8,
  ...p,
});

export const MOCK_TRIPS: TripRow[] = [
  make({ department: d.CCMS, purpose: "Lab visit", date: "2025-09-08", status: "Pending", vehicleCode: "VAN-12", km: 6 }, 1),
  make({ department: d.FIN, purpose: "Bank run", date: "2025-09-09", status: "Approved", vehicleCode: "VAN-03", km: 11 }, 2),
  make({ department: "College of Engineering (CENG)", purpose: "Equipment delivery", date: "2025-09-10", status: "Completed", vehicleCode: "BUS-01", km: 22 }, 3),
  make({ department: d.REG, purpose: "Records pickup", date: "2025-09-11", status: "Rejected", vehicleCode: "VAN-03", km: 3 }, 4),
  make({ department: "College of Arts and Sciences (CAS)", purpose: "Seminar", date: "2025-09-12", status: "Approved", vehicleCode: "VAN-12", km: 7 }, 5),
];
