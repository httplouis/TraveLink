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

  // Synchronous method to get local db (for SSR/build time)
  listLocal(filters: DriverFilters = {}) {
    return db.filter(d => matches(d, filters));
  },

  async list(filters: DriverFilters = {}) {
    // NOW USES API! Fetch from database
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      
      const url = `/api/drivers?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Transform to match Driver type
        db = result.data.map((d: any) => ({
          id: d.id,
          firstName: d.name?.split(' ')[0] || 'Unknown',
          lastName: d.name?.split(' ').slice(1).join(' ') || '',
          code: `D${d.id.slice(0, 4)}`,
          email: d.email,
          phone: d.phone || '',
          licenseNo: d.licenseNumber || d.license_no,
          licenseClass: 'B' as LicenseClass,
          licenseExpiry: d.licenseExpiry || d.license_expiry || new Date().toISOString(),
          status: (d.status === 'active' ? 'active' : 'off_duty') as DriverStatus,
          rating: d.rating || 5.0,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        }));
        saveToStorage(db); // Cache locally
      }
    } catch (error) {
      console.error('[DriversRepo] API fetch failed:', error);
      // Fall back to localStorage
    }
    
    return db.filter(d => matches(d, filters));
  },
  get(id: string) {
    return db.find(d => d.id === id) ?? null;
  },
  async create(data: Omit<Driver, "id" | "createdAt" | "updatedAt">) {
    // NOW USES API! Create in database
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          license_no: data.licenseNo,
          license_expiry: data.licenseExpiryISO,
          rating: data.rating,
          status: data.status === 'active' ? 'active' : 'inactive',
        }),
      });
      
      const result = await response.json();
      if (result.ok && result.data) {
        // Add to local cache
        const d: Driver = {
          ...data,
          id: result.data.user_id || result.data.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.push(d);
        saveToStorage(db);
        return d.id;
      }
    } catch (error) {
      console.error('[DriversRepo] API create failed:', error);
    }
    
    // Fallback to local
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
  async update(id: string, patch: Partial<Driver>) {
    // NOW USES API! Update in database
    try {
      const response = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: patch.firstName && patch.lastName ? `${patch.firstName} ${patch.lastName}` : undefined,
          email: patch.email,
          phone: patch.phone,
          license_no: patch.licenseNo,
          license_expiry: patch.licenseExpiryISO,
          rating: patch.rating,
          status: patch.status,
        }),
      });
      
      const result = await response.json();
      if (result.ok) {
        // Update local cache
        const i = db.findIndex(d => d.id === id);
        if (i >= 0) {
          db[i] = { ...db[i], ...patch, updatedAt: new Date().toISOString() };
          saveToStorage(db);
        }
        return;
      }
    } catch (error) {
      console.error('[DriversRepo] API update failed:', error);
    }
    
    // Fallback to local
    const i = db.findIndex(d => d.id === id);
    if (i >= 0) {
      db[i] = { ...db[i], ...patch, updatedAt: new Date().toISOString() };
      saveToStorage(db);
    }
  },
  async remove(id: string) {
    // NOW USES API! Delete from database
    try {
      const response = await fetch(`/api/drivers?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.ok) {
        // Remove from local cache
        const i = db.findIndex(d => d.id === id);
        if (i >= 0) {
          db.splice(i, 1);
          saveToStorage(db);
        }
        return;
      }
    } catch (error) {
      console.error('[DriversRepo] API remove failed:', error);
    }
    
    // Fallback to local
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
