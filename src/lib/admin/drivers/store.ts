import type { Driver, DriverFilters, DriverStatus, LicenseClass } from "./types";
import { sampleDrivers } from "./data";

/**
 * SSR-safe store:
 * - Initialize with sampleDrivers for both server & client (to prevent hydration mismatch)
 * - After mount, call DriversRepo.hydrateFromStorage() to replace with persisted client data.
 */

let db: Driver[] = sampleDrivers.map(d => ({ ...d }));

const LS_KEY = "travilink_drivers";
const canStorage = () => typeof window !== "undefined" && !!window.localStorage;

function saveToStorage(rows: Driver[]) {
  if (!canStorage()) return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch {}
}

function hydrateFromStorage(): boolean {
  if (!canStorage()) return false;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    db = JSON.parse(raw) as Driver[];
    return true;
  } catch {
    return false;
  }
}

function matches(d: Driver, f: DriverFilters) {
  const s = (f.search ?? "").toLowerCase();
  const okSearch =
    !s ||
    [
      d.firstName,
      d.lastName,
      d.code,
      d.phone ?? "",
      d.email ?? "",
      d.licenseNo,
    ]
      .join(" ")
      .toLowerCase()
      .includes(s);
  const okStatus = !f.status || d.status === f.status;
  const okClass = !f.licenseClass || d.licenseClass === f.licenseClass;
  return okSearch && okStatus && okClass;
}

export const DriversRepo = {
  hydrateFromStorage,

  constants: {
    statuses: ["active", "on_trip", "off_duty", "suspended"] as readonly DriverStatus[],
    licenseClasses: ["A", "B", "C", "D", "E"] as readonly LicenseClass[],
  },

  list(filters: DriverFilters = {}) {
    return db.filter(d => matches(d, filters));
  },
  get(id: string) {
    return db.find(d => d.id === id) ?? null;
  },
  create(data: Omit<Driver, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const d: Driver = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    db.push(d);
    saveToStorage(db);
    return d.id;
  },
  update(id: string, patch: Partial<Driver>) {
    const i = db.findIndex(d => d.id === id);
    if (i >= 0) {
      db[i] = { ...db[i], ...patch, updatedAt: new Date().toISOString() };
      saveToStorage(db);
    }
  },
  remove(id: string) {
    const i = db.findIndex(d => d.id === id);
    if (i >= 0) {
      db.splice(i, 1);
      saveToStorage(db);
    }
  },
  resetToSample() {
    db = sampleDrivers.map(d => ({ ...d }));
    saveToStorage(db);
  },
};
