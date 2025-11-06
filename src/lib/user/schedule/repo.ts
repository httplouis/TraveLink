// src/lib/user/schedule/repo.ts
/**
 * Read-only repository for USER calendar.
 * NOW USES DATABASE via /api/trips/my-trips! ✅
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

const LS_KEY = "travilink_user_bookings_v1"; // Kept for fallback

// Cache for API data
let cachedBookings: BookingsByDate | null = null;
let lastFetch: number = 0;
const CACHE_TTL = 30000; // 30 seconds

export function statusOfCount(n: number): "Available" | "Partial" | "Full" {
  if (n <= 0) return "Available";
  if (n >= MAX_SLOTS) return "Full";
  return "Partial";
}

/** Fetch bookings from API */
async function fetchFromAPI(): Promise<BookingsByDate> {
  try {
    const response = await fetch("/api/trips/my-trips");
    const result = await response.json();
    
    if (!result.ok || !result.data) {
      console.warn("[Schedule] API returned error, using fallback");
      return ensureSeed();
    }

    // Group by date
    const byDate: BookingsByDate = {};
    result.data.forEach((booking: Booking) => {
      if (!byDate[booking.dateISO]) {
        byDate[booking.dateISO] = [];
      }
      byDate[booking.dateISO].push(booking);
    });

    return byDate;
  } catch (error) {
    console.error("[Schedule] API fetch failed:", error);
    return ensureSeed();
  }
}

/** Get bookings (with cache) */
async function getBookings(): Promise<BookingsByDate> {
  const now = Date.now();
  if (cachedBookings && (now - lastFetch) < CACHE_TTL) {
    return cachedBookings;
  }

  const bookings = await fetchFromAPI();
  cachedBookings = bookings;
  lastFetch = now;
  return bookings;
}

export const UserScheduleRepo = {
  /** Availability counts for a month (after filters) - NOW ASYNC! */
  async list(args: ListArgs): Promise<AvailabilityMap> {
    const byDate = await getBookings();
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

  /** Get bookings for a specific date (after filters) - NOW ASYNC! */
  async getBookings(dateISO: string, args: Omit<ListArgs, "month" | "year">): Promise<Booking[]> {
    const byDate = await getBookings();
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
  
  /** Clear cache (call this after submitting new request) */
  clearCache() {
    cachedBookings = null;
    lastFetch = 0;
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
