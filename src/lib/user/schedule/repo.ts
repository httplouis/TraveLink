// src/lib/user/schedule/repo.ts
/**
 * Read-only repository for USER calendar.
 * NOW USES DATABASE via /api/schedule/availability! ✅
 * Includes real-time pending/approved status tracking
 */

import type { Booking, VehicleType } from "./types";

export const MAX_SLOTS = 5;

export type AvailabilityMap = Record<string, number>;     // "YYYY-MM-DD" -> bookedCount (0..5)
export type BookingsByDate = Record<string, Booking[]>;   // dateISO -> bookings[]

export type SlotStatus = {
  total: number;
  available: number;
  pending: number;
  approved: number;
  rejected: number;
  requests: Array<{
    id: string;
    request_number: string;
    title: string;
    status: string;
    requester_name: string;
    department: string;
    vehicle?: string;
    driver?: string;
    destination?: string;
  }>;
};

export type AvailabilityWithStatus = Record<string, SlotStatus>;

type ListArgs = {
  month: number; // 0..11
  year: number;
  vehicle: "All" | VehicleType;
  q: string;
};

// Note: localStorage removed - all data now comes from database via API
// const LS_KEY = "travilink_user_bookings_v1"; // REMOVED - using database now

// Cache for API data
let cachedAvailability: AvailabilityWithStatus | null = null;
let cachedBookings: BookingsByDate | null = null;
let lastFetch: number = 0;
const CACHE_TTL = 10000; // 10 seconds for real-time updates

export function statusOfCount(n: number): "Available" | "Partial" | "Full" {
  if (n <= 0) return "Available";
  if (n >= MAX_SLOTS) return "Full";
  return "Partial";
}

/** Fetch availability with status from API */
async function fetchAvailabilityFromAPI(month: number, year: number): Promise<AvailabilityWithStatus> {
  try {
    const response = await fetch(`/api/schedule/availability?month=${month}&year=${year}`, {
      cache: "no-store",
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const result = await response.json();
    
    if (!result.ok || !result.data) {
      console.warn("[Schedule] API returned error, using fallback");
      return {};
    }

    return result.data;
  } catch (error) {
    console.error("[Schedule] API fetch failed:", error);
    return {};
  }
}

/** Get availability (with cache) */
async function getAvailability(month: number, year: number): Promise<AvailabilityWithStatus> {
  const now = Date.now();
  const cacheKey = `${month}-${year}`;
  
  if (cachedAvailability && (now - lastFetch) < CACHE_TTL) {
    return cachedAvailability;
  }

  const availability = await fetchAvailabilityFromAPI(month, year);
  cachedAvailability = availability;
  lastFetch = now;
  
  return availability;
}

/** Convert availability to bookings format for backward compatibility */
function availabilityToBookings(availability: AvailabilityWithStatus): BookingsByDate {
  const byDate: BookingsByDate = {};
  
  Object.entries(availability).forEach(([dateISO, slotStatus]) => {
    byDate[dateISO] = slotStatus.requests.map(req => ({
      id: req.id,
      dateISO,
      vehicle: (req.vehicle?.split('(')[1]?.split(')')[0] || req.vehicle?.split('(')[0] || "Van") as any,
      driver: req.driver || "TBD",
      department: req.department,
      destination: req.destination || "",
      purpose: req.title,
      departAt: "",
      returnAt: "",
      status: req.status,
      request_number: req.request_number
    }));
  });
  
  return byDate;
}

/** Get bookings (with cache) - now uses availability API */
async function getBookings(month?: number, year?: number): Promise<BookingsByDate> {
  if (month !== undefined && year !== undefined) {
    const availability = await getAvailability(month, year);
    return availabilityToBookings(availability);
  }
  
  // Fallback for old code
  const now = Date.now();
  if (cachedBookings && (now - lastFetch) < CACHE_TTL) {
    return cachedBookings;
  }

  const currentDate = new Date();
  const availability = await getAvailability(currentDate.getMonth(), currentDate.getFullYear());
  const bookings = availabilityToBookings(availability);
  cachedBookings = bookings;
  lastFetch = now;
  return bookings;
}

export const UserScheduleRepo = {
  /** Availability counts for a month (after filters) - NOW ASYNC with status! */
  async list(args: ListArgs): Promise<AvailabilityMap> {
    const availability = await getAvailability(args.month, args.year);
    const prefix = `${args.year}-${String(args.month + 1).padStart(2, "0")}-`;
    const out: AvailabilityMap = {};
    
    Object.entries(availability).forEach(([iso, slotStatus]) => {
      if (!iso.startsWith(prefix)) return;
      
      // Apply filters
      const filtered = slotStatus.requests.filter((req) => {
        const vehOk = args.vehicle === "All" || req.vehicle?.includes(args.vehicle) || true;
        const q = args.q.trim().toLowerCase();
        const qOk =
          !q ||
          req.destination?.toLowerCase().includes(q) ||
          req.department.toLowerCase().includes(q) ||
          req.title.toLowerCase().includes(q) ||
          req.driver?.toLowerCase().includes(q) ||
          req.id.toLowerCase().includes(q);
        return vehOk && qOk;
      });
      
      out[iso] = filtered.length;
    });
    
    return out;
  },

  /** Get availability with status for a month */
  async listWithStatus(args: ListArgs): Promise<AvailabilityWithStatus> {
    const availability = await getAvailability(args.month, args.year);
    const prefix = `${args.year}-${String(args.month + 1).padStart(2, "0")}-`;
    const out: AvailabilityWithStatus = {};
    
    Object.entries(availability).forEach(([iso, slotStatus]) => {
      if (!iso.startsWith(prefix)) return;
      
      // Apply filters
      const filtered = slotStatus.requests.filter((req) => {
        const vehOk = args.vehicle === "All" || req.vehicle?.includes(args.vehicle) || true;
        const q = args.q.trim().toLowerCase();
        const qOk =
          !q ||
          req.destination?.toLowerCase().includes(q) ||
          req.department.toLowerCase().includes(q) ||
          req.title.toLowerCase().includes(q) ||
          req.driver?.toLowerCase().includes(q) ||
          req.id.toLowerCase().includes(q);
        return vehOk && qOk;
      });
      
      out[iso] = {
        ...slotStatus,
        requests: filtered,
        total: filtered.length,
        available: Math.max(0, MAX_SLOTS - filtered.length),
        pending: filtered.filter(r => r.status.startsWith("pending_")).length,
        approved: filtered.filter(r => r.status === "approved").length,
        rejected: filtered.filter(r => r.status === "rejected").length
      };
    });
    
    return out;
  },

  /** Get bookings for a specific date (after filters) - NOW ASYNC! */
  async getBookings(dateISO: string, args: Omit<ListArgs, "month" | "year">): Promise<Booking[]> {
    const [year, month] = dateISO.split("-").map(Number);
    const availability = await getAvailability(month - 1, year);
    const slotStatus = availability[dateISO];
    
    if (!slotStatus) return [];
    
    return slotStatus.requests
      .filter((req) => (args.vehicle === "All" ? true : req.vehicle?.includes(args.vehicle) || true))
      .filter((req) => {
        const q = args.q.trim().toLowerCase();
        return (
          !q ||
          req.destination?.toLowerCase().includes(q) ||
          req.department.toLowerCase().includes(q) ||
          req.title.toLowerCase().includes(q) ||
          req.driver?.toLowerCase().includes(q) ||
          req.id.toLowerCase().includes(q)
        );
      })
      .slice(0, MAX_SLOTS)
      .map(req => ({
        id: req.id,
        dateISO,
        vehicle: (req.vehicle?.split('(')[1]?.split(')')[0] || req.vehicle?.split('(')[0] || "Van") as any,
        driver: req.driver || "TBD",
        department: req.department,
        destination: req.destination || "",
        purpose: req.title,
        departAt: "",
        returnAt: "",
        status: req.status,
        request_number: req.request_number
      }));
  },
  
  /** Clear cache (call this after submitting new request) */
  clearCache() {
    cachedBookings = null;
    cachedAvailability = null;
    lastFetch = 0;
  },
};

/* ---------------- seed/demo ---------------- */
// NOTE: Seeding removed - all data now comes from database
// If you need demo data, use the database seed scripts instead

function seedBookings(): BookingsByDate {
  // This function is kept for reference but should not be used
  // All booking data should come from the database via /api/schedule/availability
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
