import type { VehiclePublic, DriverPublic } from "./publicTypes";

// Mask helpers
const maskEnd = (s?: string | null, keep = 2) =>
  s ? `${"•".repeat(Math.max(0, s.length - keep))}${s.slice(-keep)}` : undefined;

const maskPlate = (plate?: string | null) => {
  if (!plate) return undefined;
  // keep last 3
  return `•••${plate.slice(-3)}`;
};

const maskName = (full?: string | null) => {
  if (!full) return "Driver";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0].slice(0, 1)}.`;
  const last = parts.pop();
  const first = parts[0];
  return `${first.slice(0, 1)}. ${last}`;
};

// Admin → Public
export function toVehiclePublic(a: any): VehiclePublic {
  return {
    id: String(a.id),
    label: a.label ?? a.model ?? "Vehicle",
    plateMasked: maskPlate(a.plateNo ?? a.plate),
    capacity: a.capacity ?? a.seats ?? undefined,
    category: a.category ?? a.type ?? undefined,
    availability: (a.availability ?? a.status ?? "available").toLowerCase(),
    notes: a.notes ?? null,
  };
}

export function toDriverPublic(a: any): DriverPublic {
  return {
    id: String(a.id),
    nameMasked: maskName(a.fullName ?? a.name),
    phoneMasked: maskEnd(a.phone, 2),
    availability: (a.availability ?? a.status ?? "available").toLowerCase(),
    licenseMasked: maskEnd(a.licenseNo, 3),
    seniority: a.seniority ?? undefined,
  };
}
