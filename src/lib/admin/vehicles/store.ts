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

  async list(filters: VehicleFilters = {}) {
    // NOW USES API! Fetch from database
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      
      const url = `/api/vehicles?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Transform to match Vehicle type
        db = result.data.map((v: any) => ({
          id: v.id,
          plateNo: v.plate_number || v.plateNo,
          code: v.code || `V${v.id.slice(0, 4)}`,
          brand: v.brand || 'Unknown',
          model: v.vehicle_name || v.model,
          type: v.type,
          capacity: v.capacity,
          status: v.status,
          notes: v.notes,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
        }));
        saveToStorage(db); // Cache locally
      }
    } catch (error) {
      console.error('[VehiclesRepo] API fetch failed:', error);
      // Fall back to localStorage
    }
    
    return db.filter(v => matches(v, filters));
  },

  get(id: string) {
    return db.find(v => v.id === id) ?? null;
  },

  async create(data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) {
    // NOW USES API! Create in database
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: data.plateNo,
          vehicle_name: data.model,
          type: data.type,
          capacity: data.capacity,
          status: data.status,
          notes: data.notes,
        }),
      });
      
      const result = await response.json();
      if (result.ok && result.data) {
        // Add to local cache
        const v: Vehicle = {
          id: result.data.id,
          plateNo: result.data.plate_number,
          code: data.code || `V${result.data.id.slice(0, 4)}`,
          brand: data.brand || 'Unknown',
          model: result.data.vehicle_name,
          type: result.data.type,
          capacity: result.data.capacity,
          status: result.data.status,
          notes: result.data.notes,
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at,
        } as Vehicle;
        db.push(v);
        saveToStorage(db);
        return v.id;
      }
    } catch (error) {
      console.error('[VehiclesRepo] API create failed:', error);
    }
    
    // Fallback to local
    const now = new Date().toISOString();
    const v: Vehicle = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now } as Vehicle;
    db.push(v);
    saveToStorage(db);
    return v.id;
  },

  async update(id: string, patch: Partial<Vehicle>) {
    // NOW USES API! Update in database
    try {
      const response = await fetch('/api/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          plate_number: patch.plateNo,
          vehicle_name: patch.model,
          type: patch.type,
          capacity: patch.capacity,
          status: patch.status,
          notes: patch.notes,
        }),
      });
      
      const result = await response.json();
      if (result.ok) {
        // Update local cache
        const i = db.findIndex(v => v.id === id);
        if (i >= 0) {
          db[i] = { ...db[i], ...patch, updatedAt: new Date().toISOString() };
          saveToStorage(db);
        }
        return;
      }
    } catch (error) {
      console.error('[VehiclesRepo] API update failed:', error);
    }
    
    // Fallback to local
    const i = db.findIndex(v => v.id === id);
    if (i >= 0) {
      db[i] = { ...db[i], ...patch, updatedAt: new Date().toISOString() };
      saveToStorage(db);
    }
  },

  async remove(id: string) {
    // NOW USES API! Delete from database
    try {
      const response = await fetch(`/api/vehicles?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.ok) {
        // Remove from local cache
        const i = db.findIndex(v => v.id === id);
        if (i >= 0) {
          db.splice(i, 1);
          saveToStorage(db);
        }
        return;
      }
    } catch (error) {
      console.error('[VehiclesRepo] API remove failed:', error);
    }
    
    // Fallback to local
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
