// src/lib/admin/schedule/utils.ts
import type { Schedule, ScheduleFilters } from "./types";

/* -------- filters/sort/paginate ---------- */
export function applyFilters(rows: Schedule[], f: ScheduleFilters): Schedule[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    const qok =
      !q ||
      [r.tripId, r.title, r.origin, r.destination].some((s) =>
        s.toLowerCase().includes(q)
      );
    const sok = f.status === "ALL" || r.status === f.status;
    const dok1 = !f.dateFrom || r.date >= f.dateFrom;
    const dok2 = !f.dateTo || r.date <= f.dateTo;
    const dr = !f.driverId || f.driverId === "ALL" || r.driverId === f.driverId;
    const vh = !f.vehicleId || f.vehicleId === "ALL" || r.vehicleId === f.vehicleId;
    return qok && sok && dok1 && dok2 && dr && vh;
  });
}


export function sortByDateTime(rows: Schedule[], dir: "asc" | "desc") {
  const k = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime) * k);
}

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return rows.slice(start, end);
}

/* -------- status guards & transitions ---------- */
export function canStart(r: Schedule)    { return r.status === "PLANNED"; }
export function canComplete(r: Schedule) { return r.status === "ONGOING"; }
export function canCancel(r: Schedule)   { return r.status === "PLANNED" || r.status === "ONGOING"; }
export function canReopen(r: Schedule)   { return r.status === "COMPLETED" || r.status === "CANCELLED"; }

/* -------- overlap & availability ---------- */
export function overlaps(a: {date:string; startTime:string; endTime:string},
                         b: {date:string; startTime:string; endTime:string}) {
  if (a.date !== b.date) return false;
  const aS = a.date + "T" + a.startTime + ":00";
  const aE = a.date + "T" + a.endTime   + ":00";
  const bS = b.date + "T" + b.startTime + ":00";
  const bE = b.date + "T" + b.endTime   + ":00";
  return !(aE <= bS || bE <= aS);
}


export function conflictsForDriver(rows: Schedule[], driverId: string, probe: Schedule, ignoreId?: string) {
  return rows.filter(r =>
    r.driverId === driverId &&
    r.id !== ignoreId &&
    r.status !== "CANCELLED" &&
    overlaps(r, probe)
  );
}
export function conflictsForVehicle(rows: Schedule[], vehicleId: string, probe: Schedule, ignoreId?: string) {
  return rows.filter(r =>
    r.vehicleId === vehicleId &&
    r.id !== ignoreId &&
    r.status !== "CANCELLED" &&
    overlaps(r, probe)
  );
}
export function isDriverAvailable(rows: Schedule[], driverId: string, probe: Schedule, ignoreId?: string) {
  return conflictsForDriver(rows, driverId, probe, ignoreId).length === 0;
}
export function isVehicleAvailable(rows: Schedule[], vehicleId: string, probe: Schedule, ignoreId?: string) {
  return conflictsForVehicle(rows, vehicleId, probe, ignoreId).length === 0;
}
