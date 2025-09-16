import type { Vehicle } from "./types";

export function validate(v: Partial<Vehicle>): string | null {
  if (!v.plateNo?.trim()) return "Plate number is required.";
  if (!v.code?.trim()) return "Vehicle code is required.";
  if (!v.brand?.trim()) return "Brand is required.";
  if (!v.model?.trim()) return "Model is required.";
  if (!v.type) return "Type is required.";
  if (typeof v.capacity !== "number" || v.capacity <= 0) return "Capacity must be a positive number.";
  if (!v.status) return "Status is required.";
  if (typeof v.odometerKm !== "number" || v.odometerKm < 0) return "Odometer must be 0 or more.";
  if (!v.lastServiceISO) return "Last service date is required.";
  return null;
}

export function toCSV(rows: Vehicle[]): string {
  const head = ["ID","Plate","Code","Brand","Model","Type","Capacity","Status","OdometerKm","LastServiceISO","UpdatedAt"];
  const lines = rows.map(v => [
    v.id, v.plateNo, v.code, v.brand, v.model, v.type, v.capacity, v.status, v.odometerKm, v.lastServiceISO, v.updatedAt
  ].map(x => `"${String(x).replaceAll('"','""')}"`).join(","));
  return [head.join(","), ...lines].join("\n");
}
