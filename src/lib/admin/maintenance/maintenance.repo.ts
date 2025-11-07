import type { MaintFilters, MaintRecord, MaintType, MaintStatus } from "./maintenance.types";

const KEY = "travilink_maintenance_records";
const FKEY = "travilink_maintenance_filters";

let memory: MaintRecord[] = [];
let memoryFilters: MaintFilters | null = null;

function canLS() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

// Cache for performance
function saveToCache(items: MaintRecord[]) {
  if (canLS()) localStorage.setItem(KEY, JSON.stringify(items));
  else memory = items;
}

function loadFromCache(): MaintRecord[] {
  if (canLS()) {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MaintRecord[]) : [];
  }
  return memory;
}

export const MaintRepo = {
  // Synchronous method to get local cache (for SSR/build time)
  listLocal(): MaintRecord[] {
    return loadFromCache();
  },

  async list(): Promise<MaintRecord[]> {
    try {
      const response = await fetch('/api/maintenance?limit=100');
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Transform from DB to frontend format
        const records: MaintRecord[] = result.data.map((d: any) => ({
          id: d.id,
          vehicleId: d.vehicle_id,
          type: d.maintenance_type as MaintType,
          status: d.status as MaintStatus,
          createdAt: d.created_at || new Date().toISOString(),
          createdBy: d.performed_by || 'System',
          description: d.description || d.notes,
          odometer: d.odometer_reading,
          cost: d.cost || 0,
          vendor: d.performed_by,
          nextDueDate: d.next_service_date?.split('T')[0],
          assignedDriverId: undefined,
          attachments: d.attachments || [],
          history: [],
        }));
        
        saveToCache(records);
        return records;
      }
    } catch (error) {
      console.error('[MaintRepo] API list failed:', error);
    }
    
    // Fallback to cache
    return loadFromCache();
  },

  save(items: MaintRecord[]) {
    // Just update cache - actual save happens in upsert
    saveToCache(items);
  },

  async upsert(rec: MaintRecord): Promise<void> {
    try {
      const isNew = !rec.id || rec.id.startsWith('temp-');
      
      const payload = {
        vehicle_id: rec.vehicleId,
        maintenance_type: rec.type,
        description: rec.description || '',
        cost: rec.cost || 0,
        scheduled_date: rec.createdAt,
        next_service_date: rec.nextDueDate,
        performed_by: rec.vendor,
        status: rec.status || 'Submitted',
        odometer_reading: rec.odometer,
        notes: rec.description,
      };
      
      if (isNew) {
        // Create
        const response = await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        
        if (result.ok && result.data) {
          rec.id = result.data.id;
        }
      } else {
        // Update
        await fetch('/api/maintenance', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: rec.id, ...payload }),
        });
      }
      
      // Update cache
      const all = loadFromCache();
      const i = all.findIndex((x) => x.id === rec.id);
      if (i >= 0) all[i] = rec;
      else all.unshift(rec);
      saveToCache(all);
    } catch (error) {
      console.error('[MaintRepo] API upsert failed:', error);
      // Fallback to local only
      const all = loadFromCache();
      const i = all.findIndex((x) => x.id === rec.id);
      if (i >= 0) all[i] = rec;
      else all.unshift(rec);
      saveToCache(all);
    }
  },

  async removeMany(ids: string[]): Promise<void> {
    try {
      // Delete from API
      await Promise.all(
        ids.map(id => 
          fetch(`/api/maintenance?id=${id}`, { method: 'DELETE' })
        )
      );
      
      // Update cache
      const all = loadFromCache().filter((r) => !ids.includes(r.id));
      saveToCache(all);
    } catch (error) {
      console.error('[MaintRepo] API removeMany failed:', error);
      // Fallback to local
      const all = loadFromCache().filter((r) => !ids.includes(r.id));
      saveToCache(all);
    }
  },

  saveFilters(f: MaintFilters) {
    if (canLS()) localStorage.setItem(FKEY, JSON.stringify(f));
    else memoryFilters = f;
  },

  loadFilters(): MaintFilters {
    if (canLS()) {
      const raw = localStorage.getItem(FKEY);
      if (raw) return JSON.parse(raw) as MaintFilters;
    } else if (memoryFilters) {
      return memoryFilters;
    }
    return {
      q: "",
      types: [],
      statuses: [],
      density: "comfortable",
    };
  },
};
