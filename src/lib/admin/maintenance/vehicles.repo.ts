import type { Vehicle } from "./maintenance.types";

export const VehiclesRepo = {
  async list(): Promise<Vehicle[]> {
    try {
      const response = await fetch('/api/vehicles');
      const result = await response.json();
      
      if (result.ok && result.data) {
        return result.data.map((v: any) => ({
          id: v.id,
          plate: v.plate_number || v.plateNo || '',
          name: v.vehicle_name || v.name || `${v.brand || ''} ${v.model || ''}`.trim() || 'Unknown Vehicle',
          vehicle_name: v.vehicle_name,
          brand: v.brand,
          model: v.model,
        }));
      }
    } catch (error) {
      console.error('[VehiclesRepo] API fetch failed:', error);
    }
    
    // Fallback to empty array
    return [];
  },
};
