import type { Vehicle, VehicleFilters, VehicleStatus, VehicleType } from "./types";

/**
 * SUPABASE-ONLY STORE:
 * - All data comes from Supabase database via API
 * - No localStorage usage - everything is in database
 */

// In-memory cache (from last API fetch)
let db: Vehicle[] = [];

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
  constants: {
    types: ["Bus", "Van", "Car", "SUV", "Motorcycle"] as readonly VehicleType[],
    statuses: ["active", "maintenance", "inactive"] as readonly VehicleStatus[],
  },

  // Synchronous method to get cached data (from last API fetch)
  listLocal(filters: VehicleFilters = {}) {
    return db.filter(v => matches(v, filters));
  },

  async list(filters: VehicleFilters = {}) {
    // FETCH FROM SUPABASE ONLY - No localStorage
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      
      const url = `/api/vehicles?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Transform to match Vehicle type
        db = result.data.map((v: any) => {
          // Parse vehicle_name to extract brand/model if possible
          // Format could be: "DAEWOO BUS", "MAXIMA BUS", "ISUZU ELF", etc.
          const vehicleName = v.vehicle_name || v.model || '';
          const nameParts = vehicleName.trim().split(/\s+/);
          
          // If vehicle_name has multiple words, first word is brand, rest is model
          // Otherwise, use vehicle_name as model
          let brand = v.brand || v.manufacturer || '';
          let model = v.model || '';
          
          if (!brand && !model && vehicleName) {
            if (nameParts.length > 1) {
              brand = nameParts[0];
              model = nameParts.slice(1).join(' ');
            } else {
              // Single word - use as model, no brand
              model = vehicleName;
              brand = '';
            }
          } else if (!model && vehicleName) {
            // If model is missing but vehicle_name exists, use vehicle_name as model
            model = vehicleName;
          }
          
          return {
            id: v.id,
            plateNo: v.plate_number || v.plateNo,
            code: v.code || `V${v.id.slice(0, 4)}`,
            brand: brand || '',
            model: model || vehicleName || '',
            type: v.type,
            capacity: v.capacity,
            status: v.status,
            notes: v.notes,
            createdAt: v.created_at,
            updatedAt: v.updated_at,
            photoUrl: v.photo_url || v.photoUrl, // Include photo URL
          };
        });
      } else {
        console.error('[VehiclesRepo] API returned error:', result);
        db = [];
      }
    } catch (error) {
      console.error('[VehiclesRepo] API fetch failed:', error);
      db = [];
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
        // Refresh from API to get latest data
        await this.list();
        return result.data.id;
      } else {
        throw new Error(result.error || 'Failed to create vehicle');
      }
    } catch (error) {
      console.error('[VehiclesRepo] API create failed:', error);
      throw error;
    }
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
        // Refresh from API to get latest data
        await this.list();
        return;
      } else {
        throw new Error(result.error || 'Failed to update vehicle');
      }
    } catch (error) {
      console.error('[VehiclesRepo] API update failed:', error);
      throw error;
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
        // Refresh from API to get latest data
        await this.list();
        return;
      } else {
        throw new Error(result.error || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('[VehiclesRepo] API remove failed:', error);
      throw error;
    }
  },
};
