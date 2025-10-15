import type { Vehicle, VehicleFilters, VehicleStatus, VehicleType } from "./types";
import { sampleVehicles } from "./data";

/**
 * IMPORTANT (SSR-safe):
 * - We initialize with sample data for BOTH server & client so the first render matches.
 * - After mount (in your page), call VehiclesRepo.hydrateFromStorage() to replace with persisted data.
 */

// In-memory DB (module-level)
let db: Vehicle[] = sampleVehicles.map(v => ({ ...v })) as Vehicle[];

// ---- localStorage helpers (client only; safe to import on server) ----
const LS_KEY = "travilink_vehicles";
const canStorage = () => typeof window !== "undefined" && !!window.localStorage;

function saveToStorage(rows: Vehicle[]) {
  if (!canStorage()) return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch {}
}

/** Load from localStorage into in-memory DB. Returns true if hydrated. */
function hydrateFromStorage(): boolean {
  if (!canStorage()) return false;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    db = JSON.parse(raw) as Vehicle[];
    return true;
  } catch {
    return false;
  }
}

// ---- Utils ----
function matches(v: Vehicle, f: VehicleFilters) {
  const s = (f.search ?? "").toLowerCase();
  const okSearch = !s || [v.plateNo, v.code, v.brand, v.model].some(x => x.toLowerCase().includes(s));
  const okType = !f.type || v.type === f.type;
  const okStatus = !f.status || v.status === f.status;
  return okSearch && okType && okStatus;
}

// ---- Public API ----
export const VehiclesRepo = {
  // expose so the page can hydrate AFTER mount (prevents hydration mismatch)
  hydrateFromStorage,

  constants: {
    types: ["Bus", "Van", "Car", "SUV", "Motorcycle"] as readonly VehicleType[],
    statuses: ["active", "maintenance", "inactive"] as readonly VehicleStatus[],
  },

  list(filters: VehicleFilters = {}) {
    return db.filter(v => matches(v, filters));
  },

  get(id: string) {
    return db.find(v => v.id === id) ?? null;
  },

  create(data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const v: Vehicle = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now } as Vehicle;
    db.push(v);
    saveToStorage(db);
    return v.id;
  },

  update(id: string, patch: Partial<Vehicle>) {
    const i = db.findIndex(v => v.id === id);
    if (i >= 0) {
      db[i] = { ...db[i], ...patch, updatedAt: new Date().toISOString() };
      saveToStorage(db);
    }
  },

  remove(id: string) {
    const i = db.findIndex(v => v.id === id);
    if (i >= 0) {
      db.splice(i, 1);
      saveToStorage(db);
    }
  },

  /** DEV helper: restore sample seed (also persists) */
  resetToSample() {
    db = sampleVehicles.map(v => ({ ...v })) as Vehicle[];
    saveToStorage(db);
  },
};
