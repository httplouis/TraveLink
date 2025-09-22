// src/lib/admin/schedule/filters.ts
import type { Schedule, ScheduleStatus } from "./types";

/** Accept both TitleCase (old UI) and UPPER_CASE (domain) */
type FilterStatus =
  | "All"
  | "Planned"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "PLANNED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export type ScheduleFilterState = {
  status: FilterStatus;
  dept: "All" | "CCMS" | "HR" | "Registrar" | "Finance"; // keep/remove based on your model
  driver: "All" | string;   // driverId
  vehicle: "All" | string;  // vehicleId
  from?: string | null;     // YYYY-MM-DD
  to?: string | null;       // YYYY-MM-DD
  mode: "auto" | "apply";
  search: string;
};

export const DEFAULT_SCH_FILTERS: ScheduleFilterState = {
  status: "All",
  dept: "All",
  driver: "All",
  vehicle: "All",
  from: null,
  to: null,
  mode: "auto",
  search: "",
};

/** Map UI status → domain ScheduleStatus (or null for “All”) */
function normalizeFilterStatus(s: FilterStatus): ScheduleStatus | null {
  switch (s) {
    case "All":
      return null;
    case "Planned":
    case "PLANNED":
      return "PLANNED";
    case "InProgress":
    case "ONGOING":
      return "ONGOING";
    case "Completed":
    case "COMPLETED":
      return "COMPLETED";
    case "Cancelled":
    case "CANCELLED":
      return "CANCELLED";
    default:
      return null;
  }
}

export function filterSchedules(rows: Schedule[], f: ScheduleFilterState): Schedule[] {
  let out = rows;

  // status
  const norm = normalizeFilterStatus(f.status);
  if (norm) out = out.filter((r) => r.status === norm);

  // dept (optional – remove/adjust if Schedule doesn’t have it)
  if (f.dept !== "All") out = out.filter((r: any) => r.dept === f.dept);

  // driver/vehicle
  if (f.driver !== "All") out = out.filter((r) => r.driverId === f.driver);
  if (f.vehicle !== "All") out = out.filter((r) => r.vehicleId === f.vehicle);

  // date range (YYYY-MM-DD compare)
  if (f.from) out = out.filter((r) => r.date >= f.from!);
  if (f.to) out = out.filter((r) => r.date <= f.to!);

  // search
  const q = f.search.trim().toLowerCase();
  if (q) {
    out = out.filter((r) => {
      const hay = [
        r.tripId,
        r.title,
        r.origin,
        r.destination,
        (r as any).driverName,
        (r as any).vehicleLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  return out;
}
