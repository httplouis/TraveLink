import { Schedule, ScheduleStatus, Driver, Vehicle } from "./types";

/* ---------- storage guards ---------- */
const KEY = "travilink.schedules.v1";
const KEY_SEQ = "travilink.schedules.seq.v1"; // per-day counters
const isBrowser = typeof window !== "undefined" && !!globalThis.window?.localStorage;
let MEM: Schedule[] | null = null;
let MEM_SEQ: Record<string, number> | null = null;

function readSeq(): Record<string, number> {
  if (isBrowser) {
    const raw = window.localStorage.getItem(KEY_SEQ);
    return raw ? JSON.parse(raw) : {};
  }
  return MEM_SEQ ?? (MEM_SEQ = {});
}
function writeSeq(seq: Record<string, number>) {
  if (isBrowser) window.localStorage.setItem(KEY_SEQ, JSON.stringify(seq));
  else MEM_SEQ = seq;
}

/* ---------- Trip ID helpers ---------- */
// TRIP-YYYYMMDD-0001 (per day incremental)
function fmtTripId(date: string, n: number) {
  const d = date.replaceAll("-", "");
  return `TRIP-${d}-${String(n).padStart(4, "0")}`;
}
/** Reserve and return the next Trip ID for a given date. */
function allocateTripId(date: string) {
  const seq = readSeq();
  const cur = seq[date] ?? 0;
  const next = cur + 1;
  seq[date] = next;
  writeSeq(seq);
  return fmtTripId(date, next);
}
/** Peek next Trip ID (no increment) for preview. */
function peekTripId(date: string) {
  const seq = readSeq();
  const next = (seq[date] ?? 0) + 1;
  return fmtTripId(date, next);
}

/* ---------- seed data ---------- */
const drivers: Driver[] = [
  { id: "d1", name: "Juan Dela Cruz" },
  { id: "d2", name: "Maria Santos" },
  { id: "d3", name: "Roberto Reyes" },
];

const vehicles: Vehicle[] = [
  { id: "v1", label: "Toyota HiAce", plateNo: "ABC-1234" },
  { id: "v2", label: "Hyundai County", plateNo: "XYZ-5678" },
  { id: "v3", label: "Mitsubishi L300", plateNo: "MSE-2025" },
];

function seed(): Schedule[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const plus = (n: number) => new Date(today.getTime() + n * 86400000);
  const d = (dt: Date) => dt.toISOString().slice(0, 10);

  const base: Omit<Schedule, "id" | "createdAt" | "tripId">[] = [
    {
      title: "Faculty Meeting Trip",
      origin: "Main Campus",
      destination: "CTE Building",
      date: d(today),
      startTime: "08:00",
      endTime: "09:00",
      driverId: "d1",
      vehicleId: "v1",
      status: "PLANNED",
      notes: "Bring projector",
      requestId: null,
    },
    {
      title: "Library Books Transfer",
      origin: "Library",
      destination: "Archive",
      date: d(plus(1)),
      startTime: "10:00",
      endTime: "11:30",
      driverId: "d2",
      vehicleId: "v2",
      status: "PLANNED",
      requestId: null,
      notes: "",
    },
    {
      title: "Shuttle – Event",
      origin: "Gate 1",
      destination: "Gym",
      date: d(plus(-1)),
      startTime: "14:00",
      endTime: "16:00",
      driverId: "d3",
      vehicleId: "v3",
      status: "COMPLETED",
      requestId: null,
      notes: "",
    },
  ];

  const rows: Schedule[] = base.map((b, i) => ({
    ...b,
    id: `s${i + 1}`,
    tripId: allocateTripId(b.date),
    createdAt: now.toISOString(),
  }));

  if (isBrowser) window.localStorage.setItem(KEY, JSON.stringify(rows));
  else MEM = rows;

  return rows;
}

function readAll(): Schedule[] {
  if (isBrowser) {
    const raw = window.localStorage.getItem(KEY);
    const parsed: Schedule[] | null = raw ? JSON.parse(raw) : null;
    const rows = parsed ?? seed();
    return backfillTripIds(rows);
  }
  const rows = MEM ?? seed();
  return backfillTripIds(rows);
}

function writeAll(rows: Schedule[]) {
  if (isBrowser) window.localStorage.setItem(KEY, JSON.stringify(rows));
  else MEM = rows;
}

/* Backfill missing tripId for legacy rows */
function backfillTripIds(rows: Schedule[]) {
  let changed = false;
  const out = rows.map((r) => {
    if (!r.tripId) {
      changed = true;
      return { ...r, tripId: allocateTripId(r.date) };
    }
    return r;
  });
  if (changed) writeAll(out);
  return out;
}

/* ---------- conflict helpers (local) ---------- */
function overlaps(a: { date: string; startTime: string; endTime: string },
                  b: { date: string; startTime: string; endTime: string }) {
  if (a.date !== b.date) return false;
  const aS = a.date + "T" + a.startTime + ":00";
  const aE = a.date + "T" + a.endTime + ":00";
  const bS = b.date + "T" + b.startTime + ":00";
  const bE = b.date + "T" + b.endTime + ":00";
  return !(aE <= bS || bE <= aS);
}
function findConflicts(rows: Schedule[], probe: Schedule, ignoreId?: string) {
  const driver = rows.filter(
    (r) =>
      r.status !== "CANCELLED" &&
      r.id !== ignoreId &&
      r.driverId === probe.driverId &&
      overlaps(r, probe)
  );
  const vehicle = rows.filter(
    (r) =>
      r.status !== "CANCELLED" &&
      r.id !== ignoreId &&
      r.vehicleId === probe.vehicleId &&
      overlaps(r, probe)
  );
  return { driver, vehicle };
}

/* ---------- repo ---------- */
export const ScheduleRepo = {
  list(): Schedule[] {
    return readAll();
  },
  get(id: string): Schedule | undefined {
    return readAll().find((r) => r.id === id);
  },
  /** show the next Trip ID for a date without consuming it */
  peekTripId(date: string) {
    return peekTripId(date);
  },
  create(input: Omit<Schedule, "id" | "createdAt" | "tripId">): Schedule {
    const rows = readAll();
    const id =
      (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random())).toString();
    const rec: Schedule = {
      ...input,
      id,
      tripId: allocateTripId(input.date), // 👈 assign immutable Trip ID
      createdAt: new Date().toISOString(),
    };

    const { driver, vehicle } = findConflicts(rows, rec);
    if (driver.length || vehicle.length) {
      const d = driver[0];
      const v = vehicle[0];
      const msg = [
        d ? `Driver busy with ${d.title || "another schedule"} (${d.date} ${d.startTime}-${d.endTime})` : "",
        v ? `Vehicle busy with ${v.title || "another schedule"} (${v.date} ${v.startTime}-${v.endTime})` : "",
      ]
        .filter(Boolean)
        .join(" • ");
      throw new Error(msg || "Conflict");
    }

    rows.unshift(rec);
    writeAll(rows);
    return rec;
  },
  update(id: string, patch: Partial<Schedule>): Schedule | undefined {
    const rows = readAll();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return;

    const prev = rows[idx];
    // tripId is immutable; ignore attempts to change it
    const { tripId: _ignore, ...patchSafe } = patch as any;
    const next = { ...prev, ...patchSafe } as Schedule;

    // only validate when changing assignment/time
    const touchesAssignment =
      (patchSafe.date && patchSafe.date !== prev.date) ||
      (patchSafe.startTime && patchSafe.startTime !== prev.startTime) ||
      (patchSafe.endTime && patchSafe.endTime !== prev.endTime) ||
      (patchSafe.driverId && patchSafe.driverId !== prev.driverId) ||
      (patchSafe.vehicleId && patchSafe.vehicleId !== prev.vehicleId);

    if (touchesAssignment) {
      const { driver, vehicle } = findConflicts(rows, next, id);
      if (driver.length || vehicle.length) {
        const d = driver[0];
        const v = vehicle[0];
        const msg = [
          d ? `Driver busy with ${d.title || "another schedule"} (${d.date} ${d.startTime}-${d.endTime})` : "",
          v ? `Vehicle busy with ${v.title || "another schedule"} (${v.date} ${v.startTime}-${v.endTime})` : "",
        ]
          .filter(Boolean)
          .join(" • ");
        throw new Error(msg || "Conflict");
      }
    }

    rows[idx] = next;
    writeAll(rows);
    return rows[idx];
  },
  removeMany(ids: string[]) {
    const set = new Set(ids);
    writeAll(readAll().filter((r) => !set.has(r.id)));
  },
  setStatus(id: string, status: ScheduleStatus) {
    return this.update(id, { status });
  },

  constants: {
    drivers,
    vehicles,
    statuses: ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"] as ScheduleStatus[],
  },
};
