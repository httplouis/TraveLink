// src/lib/user/schedule/repo.ts
/**
 * Read-only repository for USER calendar.
 * Replace with real DB later; deterministic localStorage seed for now.
 */

import type { Booking, VehicleType } from "./types";

export const MAX_SLOTS = 5;

export type AvailabilityMap = Record<string, number>;     // "YYYY-MM-DD" -> bookedCount (0..5)
export type BookingsByDate = Record<string, Booking[]>;   // dateISO -> bookings[]

type ListArgs = {
  month: number; // 0..11
  year: number;
  vehicle: "All" | VehicleType;
  q: string;
};

const LS_KEY = "travilink_user_bookings_v1";

export function statusOfCount(n: number): "Available" | "Partial" | "Full" {
  if (n <= 0) return "Available";
  if (n >= MAX_SLOTS) return "Full";
  return "Partial";
}

export const UserScheduleRepo = {
  /** Availability counts for a month (after filters) */
  list(args: ListArgs): AvailabilityMap {
    const byDate = ensureSeed();
    const prefix = `${args.year}-${String(args.month + 1).padStart(2, "0")}-`;
    const out: AvailabilityMap = {};
    Object.entries(byDate).forEach(([iso, bookings]) => {
      if (!iso.startsWith(prefix)) return;
      const filtered = bookings.filter((b) => {
        const vehOk = args.vehicle === "All" || b.vehicle === args.vehicle;
        const q = args.q.trim().toLowerCase();
        const qOk =
          !q ||
          b.destination.toLowerCase().includes(q) ||
          b.department.toLowerCase().includes(q) ||
          b.purpose.toLowerCase().includes(q) ||
          b.driver.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q);
        return vehOk && qOk;
      });
      out[iso] = filtered.length;
    });
    return out;
  },

  /** Get bookings for a specific date (after filters) */
  getBookings(dateISO: string, args: Omit<ListArgs, "month" | "year">): Booking[] {
    const byDate = ensureSeed();
    const arr = byDate[dateISO] || [];
    return arr
      .filter((b) => (args.vehicle === "All" ? true : b.vehicle === args.vehicle))
      .filter((b) => {
        const q = args.q.trim().toLowerCase();
        return (
          !q ||
          b.destination.toLowerCase().includes(q) ||
          b.department.toLowerCase().includes(q) ||
          b.purpose.toLowerCase().includes(q) ||
          b.driver.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
        );
      })
      .slice(0, MAX_SLOTS); // safety
  },
};

/* ---------------- seed/demo ---------------- */

function ensureSeed(): BookingsByDate {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seeded = seedBookings();
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(seeded));
  } catch {}
  return seeded;
}

function seedBookings(): BookingsByDate {
  const now = new Date();
  const out: BookingsByDate = {};
  const depts = ["Transport Office","CBA","COE","COED","HR","Comptroller","ITSO","Liberal Arts"];
  const dests = ["Lucena City Hall","SM Lucena","MSEUF Candelaria","CHED Region IV-A","San Pablo","Batangas Pier","Intramuros","UP Diliman"];
  const purposes = ["Seminar","Official Meeting","Document Filing","Athletic Meet","Field Work","Competition","Campus Visit"];
  const drivers = ["R. Santos","M. Dela Cruz","A. Ramos","J. Garcia","P. Navarro","L. Castillo"];
  const vehicles: VehicleType[] = ["Bus","Van","Car"];

  // current month ± 6
  for (let off = -6; off <= 6; off++) {
    const d = new Date(now.getFullYear(), now.getMonth() + off, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const total = new Date(y, m + 1, 0).getDate();
    for (let day = 1; day <= total; day++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const rng = ((y * 10000 + (m + 1) * 100 + day) % 6); // 0..5 events
      const cnt = Math.min(MAX_SLOTS, rng);
      if (cnt <= 0) continue;
      out[iso] = [];
      for (let i = 0; i < cnt; i++) {
        const pick = (arr: string[] | VehicleType[]) => arr[(i + day) % arr.length] as any;
        const depart = `${String(7 + (i % 5)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
        const ret = `${String(12 + (i % 7)).padStart(2, "0")}:${i % 2 ? "00" : "30"}`;
        out[iso].push({
          id: `BK-${y}${String(m + 1).padStart(2, "0")}${String(day).padStart(2, "0")}-${i + 1}`,
          dateISO: iso,
          vehicle: pick(vehicles),
          driver: pick(drivers),
          department: pick(depts),
          destination: pick(dests),
          purpose: pick(purposes),
          departAt: depart,
          returnAt: ret,
        });
      }
    }
  }
  return out;
}
