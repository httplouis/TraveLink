import type { Driver, DriverFilters, DriverStatus, LicenseClass } from "./types";

/**
 * SUPABASE-ONLY STORE:
 * - All data comes from Supabase database via API
 * - No localStorage usage - everything is in database
 */

let db: Driver[] = [];

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
  constants: {
    statuses: ["active", "on_trip", "off_duty", "suspended"] as readonly DriverStatus[],
    licenseClasses: ["A", "B", "C", "D", "E"] as readonly LicenseClass[],
  },

  // Synchronous method to get cached data (from last API fetch)
  listLocal(filters: DriverFilters = {}) {
    return db.filter(d => matches(d, filters));
  },

  async list(filters: DriverFilters = {}) {
    // FETCH FROM SUPABASE ONLY - No localStorage
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      
      const url = `/api/drivers?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Transform to match Driver type - ALL DATA FROM DATABASE
        db = result.data.map((d: any) => ({
          id: d.id,
          firstName: d.name?.split(' ')[0] || 'Unknown',
          lastName: d.name?.split(' ').slice(1).join(' ') || '',
          code: `D${d.id.slice(0, 4)}`,
          email: d.email || '',
          phone: d.phone || '',
          department: d.department || 'Transport Office', // From database, default to Transport Office
          licenseNo: d.licenseNumber || d.license_no || '',
          licenseClass: 'B' as LicenseClass,
          licenseExpiry: d.licenseExpiry || d.license_expiry || new Date().toISOString(),
          status: (d.isAvailable ? 'active' : 'off_duty') as DriverStatus,
          rating: d.rating || 5.0,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        }));
      } else {
        console.error('[DriversRepo] API returned error:', result);
        db = [];
      }
    } catch (error) {
      console.error('[DriversRepo] API fetch failed:', error);
      db = [];
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
        // Refresh from API to get latest data
        await this.list();
        return result.data.user_id || result.data.id;
      } else {
        throw new Error(result.error || 'Failed to create driver');
      }
    } catch (error) {
      console.error('[DriversRepo] API create failed:', error);
      throw error;
    }
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
        // Refresh from API to get latest data
        await this.list();
        return;
      } else {
        throw new Error(result.error || 'Failed to update driver');
      }
    } catch (error) {
      console.error('[DriversRepo] API update failed:', error);
      throw error;
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
        // Refresh from API to get latest data
        await this.list();
        return;
      } else {
        throw new Error(result.error || 'Failed to delete driver');
      }
    } catch (error) {
      console.error('[DriversRepo] API remove failed:', error);
      throw error;
    }
  },
};
