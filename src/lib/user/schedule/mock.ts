// src/lib/user/schedule/mock.ts
import type { Trip, VehicleType } from "./types";

/**
 * Lightweight mock data so Dashboard.container.tsx and legacy
 * filter/utils keep compiling. We include varied statuses so
 * the Status filter works ("Available" | "Partial" | "Full").
 *
 * NOTE: These are independent from the month-view seed used by
 * the read-only calendar. You can delete this file once the
 * dashboard is wired to real data.
 */

const vehicles: VehicleType[] = ["Bus", "Van", "Car"];
const depts = ["Transport Office", "COE", "COED", "HR", "Comptroller", "ITSO"];
const dests = [
  "CHED Region IV-A",
  "UP Diliman",
  "San Pablo",
  "Batangas Pier",
  "Lucena City Hall",
  "Intramuros",
];
const purposes = [
  "Official Meeting",
  "Seminar",
  "Document Filing",
  "Athletic Meet",
  "Campus Visit",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** build a Trip quickly */
function trip(
  y: number,
  m0: number, // month index 0..11
  d: number,
  idx: number,
  status: Trip["status"]
): Trip {
  const id = `TRIP-${y}${pad(m0 + 1)}${pad(d)}-${idx + 1}`;
  const dateISO = `${y}-${pad(m0 + 1)}-${pad(d)}`;
  const vehicle = vehicles[(d + idx) % vehicles.length];
  const driver = ["R. Santos", "M. Dela Cruz", "A. Ramos", "J. Garcia"][(d + idx) % 4];
  const department = depts[(d + idx) % depts.length];
  const destination = dests[(d + idx) % dests.length];
  const purpose = purposes[(d + idx) % purposes.length];
  const departAt = `${pad(8 + (idx % 3))}:${idx % 2 ? "30" : "00"}`;
  const returnAt = `${pad(13 + (idx % 4))}:${idx % 2 ? "00" : "30"}`;
  const start = `${dateISO}T${departAt}:00`;

  return {
    id,
    dateISO,
    vehicle,
    driver,
    department,
    destination,
    purpose,
    departAt,
    returnAt,
    start,
    status,
  };
}

/** create a small spread of trips across the current month with mixed statuses */
function buildMock(): Trip[] {
  const now = new Date();
  const y = now.getFullYear();
  const m0 = now.getMonth();

  const items: Trip[] = [];
  // days with "Available" (0 bookings) won't produce a trip here by design.
  // We'll emit several days as Partial and a few as Full.
  const partialDays = [1, 5, 8, 12, 18, 22, 26];
  const fullDays = [3, 10, 17, 25];

  for (const d of partialDays) {
    // 2 trips on partial days
    items.push(trip(y, m0, d, 0, "Partial"));
    items.push(trip(y, m0, d, 1, "Partial"));
  }
  for (const d of fullDays) {
    // 5 trips on full days
    for (let i = 0; i < 5; i++) items.push(trip(y, m0, d, i, "Full"));
  }

  return items;
}

export const MOCK_TRIPS: Trip[] = buildMock();
