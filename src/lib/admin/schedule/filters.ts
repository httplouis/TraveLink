// src/lib/admin/schedule/filters.ts
import type { Schedule } from "./types";
import { ScheduleRepo } from "./store";

export type ScheduleFilterState = {
  status: "All" | "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  driver: "All" | string;   // driverId
  vehicle: "All" | string;  // vehicleId
  from: "" | string;        // yyyy-mm-dd
  to: "" | string;          // yyyy-mm-dd
  search: string;           // free text
  mode: "auto" | "apply";
};

export const DEFAULT_SCH_FILTERS: ScheduleFilterState = {
  status: "All",
  driver: "All",
  vehicle: "All",
  from: "",
  to: "",
  search: "",
  mode: "auto",
};

export function filterSchedules(
  rows: Schedule[],
  f: ScheduleFilterState
): Schedule[] {
  const q = (f.search ?? "").toLowerCase().trim();

  // map driverId -> driver name (lowercase) for search
  const driverNameById: Record<string, string> = Object.fromEntries(
    ScheduleRepo.constants.drivers.map((d) => [d.id, d.name.toLowerCase()])
  );

  return (rows ?? []).filter((r) => {
    const okStatus = f.status === "All" || r.status === f.status;
    const okDriver = f.driver === "All" || r.driverId === f.driver;
    const okVehicle = f.vehicle === "All" || r.vehicleId === f.vehicle;
    const okFrom = !f.from || r.date >= f.from;
    const okTo = !f.to || r.date <= f.to;

    const driverName = driverNameById[r.driverId] ?? "";
    const okSearch =
      !q ||
      [r.tripId, r.title, r.origin, r.destination, driverName].some((s) =>
        (s ?? "").toLowerCase().includes(q)
      );

    return okStatus && okDriver && okVehicle && okFrom && okTo && okSearch;
  });
}
