import type { Vehicle } from "./types";


export function validate(v: Omit<Vehicle, "id"|"createdAt"|"updatedAt">): string | null {
if (!v.plateNo?.trim()) return "Plate No. is required";
if (!v.code?.trim()) return "Vehicle Code is required";
if (!v.brand?.trim()) return "Brand is required";
if (!v.model?.trim()) return "Model is required";
if (v.capacity < 1) return "Capacity must be at least 1";
if (v.odometerKm < 0) return "Odometer cannot be negative";
return null;
}


export function toCSV(rows: Vehicle[]) {
const header = [
"plateNo","code","brand","model","type","capacity","status","odometerKm","lastServiceISO","notes",
];
const lines = [header.join(","), ...rows.map(r => [
r.plateNo, r.code, r.brand, r.model, r.type, String(r.capacity), r.status, String(r.odometerKm), r.lastServiceISO, r.notes ?? "",
].map(x => `"${String(x).replaceAll('"','""')}"`).join(","))];
return lines.join("\n");
}