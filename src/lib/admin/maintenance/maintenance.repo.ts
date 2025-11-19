import type { MaintFilters, MaintRecord, MaintType, MaintStatus } from "./maintenance.types";

const FKEY = "travilink_maintenance_filters";

let memory: MaintRecord[] = [];
let memoryFilters: MaintFilters | null = null;

function canLS() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

// In-memory cache only (from last API fetch) - NO localStorage
function saveToCache(items: MaintRecord[]) {
  memory = items;
}

function loadFromCache(): MaintRecord[] {
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
        // Map database status to frontend status
        const mapDbStatusToFrontend = (dbStatus: string): MaintStatus => {
          const mapping: Record<string, MaintStatus> = {
            'scheduled': 'Submitted',
            'in_progress': 'In-Progress',
            'completed': 'Completed',
            'cancelled': 'Rejected',
            'Submitted': 'Submitted',
            'Acknowledged': 'Acknowledged',
            'In-Progress': 'In-Progress',
            'Completed': 'Completed',
            'Rejected': 'Rejected',
          };
          return mapping[dbStatus] || 'Submitted';
        };
        
        // Transform from DB to frontend format
        const records: MaintRecord[] = result.data.map((d: any) => ({
          id: d.id,
          vehicleId: d.vehicle_id,
          type: d.maintenance_type as MaintType,
          status: mapDbStatusToFrontend(d.status || 'scheduled'),
          createdAt: d.created_at || d.scheduled_date || new Date().toISOString(),
          createdBy: d.performed_by || 'System',
          description: d.description || d.notes || '',
          odometer: d.odometer_reading,
          cost: d.cost || 0,
          vendor: d.performed_by,
          nextDueDate: d.next_service_date ? (typeof d.next_service_date === 'string' ? d.next_service_date.split('T')[0] : new Date(d.next_service_date).toISOString().split('T')[0]) : undefined,
          assignedDriverId: undefined,
          attachments: Array.isArray(d.attachments) ? d.attachments : [],
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
      
      // Map frontend status to database status
      const mapFrontendStatusToDb = (frontendStatus: MaintStatus): string => {
        const mapping: Record<MaintStatus, string> = {
          'Submitted': 'scheduled',
          'Acknowledged': 'scheduled',
          'In-Progress': 'in_progress',
          'Completed': 'completed',
          'Rejected': 'cancelled',
        };
        return mapping[frontendStatus] || 'scheduled';
      };
      
      const payload = {
        vehicle_id: rec.vehicleId,
        maintenance_type: rec.type,
        description: rec.description || '',
        cost: rec.cost || 0,
        scheduled_date: rec.createdAt,
        next_service_date: rec.nextDueDate,
        performed_by: rec.vendor,
        status: mapFrontendStatusToDb(rec.status || 'Submitted'),
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
