import type { Maintenance, MaintFilters, MaintStatus } from "./types";

export const MaintConstants = {
  types: ["Preventive","Repair","Inspection"] as const,
  statuses: ["draft","submitted","acknowledged","in-progress","completed","rejected"] as const satisfies readonly MaintStatus[],
};

export function validate(m: Partial<Maintenance>): string | null {
  if (!m.vehicleCode?.trim()) return "Vehicle code is required.";
  if (!m.plateNo?.trim()) return "Plate number is required.";
  if (!m.type) return "Type is required.";
  if (!m.description?.trim()) return "Description is required.";
  if (typeof m.odometerKm !== "number" || m.odometerKm < 0) return "Odometer must be 0 or more.";
  if (!m.requestDate) return "Request date is required.";
  if (!m.status) return "Status is required.";
  return null;
}

export function applyFilters(rows: Maintenance[], f?: MaintFilters): Maintenance[] {
  if (!f) return rows;
  const q = (f.search ?? "").toLowerCase().trim();
  return rows.filter(r => {
    const okQ = !q || [
      r.vehicleCode, r.plateNo, r.type, r.status, r.description
    ].join(" ").toLowerCase().includes(q);
    const okT = !f.type || r.type === f.type;
    const okS = !f.status || r.status === f.status;
    return okQ && okT && okS;
  });
}
