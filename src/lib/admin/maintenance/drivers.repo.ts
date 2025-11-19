import type { Driver } from "./maintenance.types";

export const DriverRepo = {
  async list(): Promise<Driver[]> {
    try {
      const response = await fetch('/api/drivers');
      const result = await response.json();
      
      if (result.ok && result.data) {
        return result.data.map((d: any) => ({
          id: d.id,
          name: d.name || 'Unknown',
          badge: d.licenseNumber || d.license_no || undefined,
        }));
      }
    } catch (error) {
      console.error('[DriverRepo] API fetch failed:', error);
    }
    
    // Fallback to empty array
    return [];
  },
};
