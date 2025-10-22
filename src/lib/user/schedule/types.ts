// src/lib/user/schedule/types.ts

/* ---------- core types used by the user calendar ---------- */

export type VehicleType = "Bus" | "Van" | "Car";

export type Booking = {
  id: string;
  dateISO: string;        // YYYY-MM-DD
  vehicle: VehicleType;
  driver: string;         // Driver full name
  department: string;
  destination: string;
  purpose: string;
  departAt: string;       // "HH:mm" or ISO datetime
  returnAt: string;       // "HH:mm" or ISO datetime
};

export type UserCalFilters = {
  status: "All" | "Available" | "Partial" | "Full";
  vehicle: "All" | VehicleType;
  q: string;              // destination / dept / ID / driver — client-side filter
  jumpTo?: string | null; // YYYY-MM-DD
};

/* ---------- extras for legacy/dashboard modules ---------- */

export type Status = "All" | "Available" | "Partial" | "Full"; // UI legend buckets
export type DayStatus = "available" | "partial" | "full";      // day occupancy

// Legacy "Trip" expected by filter.ts/utils.ts/dashboard
// Reuses Booking fields + adds start (ISO datetime) and status (no "All")
export type Trip = Booking & {
  /** ISO datetime for trip start, e.g., `${dateISO}T${departAt}:00` */
  start: string;
  /** bucket used by old filters (exclude "All") */
  status: Exclude<Status, "All">; // "Available" | "Partial" | "Full"
};
