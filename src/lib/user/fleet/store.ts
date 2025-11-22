export type Vehicle = {
  id: string;
  code: string;         // e.g., "Bus 12"
  plate: string;
  type: "Bus" | "Van" | "Car" | "Truck";
  seats: number;
  status: "available" | "assigned" | "maintenance" | "offline";
};

export type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  // photo intentionally omitted for privacy
  status: "Available" | "On Trip" | "Off Duty";
  canDrive: ("Bus" | "Van" | "Car" | "Truck")[];
  lastActive?: string; // ISO
};

// Note: Vehicles are now fetched from API - see VehiclesList component
const VEHICLES: Vehicle[] = [
  { id: "v1", code: "Bus 12", plate: "ABC-1234", type: "Bus", seats: 45, status: "available" },
  { id: "v2", code: "Van 03", plate: "XYZ-9087", type: "Van", seats: 12, status: "assigned" },
  { id: "v3", code: "Car 07", plate: "EUA-2025", type: "Car", seats: 4, status: "maintenance" },
];

export const FleetRepo = {
  listVehicles: () => [...VEHICLES],
  // Drivers are now fetched from API - use /api/drivers endpoint
  // This function is deprecated - use API directly in components
  listDrivers: async (): Promise<Driver[]> => {
    try {
      const response = await fetch('/api/drivers');
      const data = await response.json();
      
      if (data.ok && data.data) {
        // Transform API response to Driver format
        return data.data.map((d: any) => {
          // Parse name (format: "LASTNAME, FIRSTNAME" or "First Last")
          const nameParts = d.name?.split(', ') || d.name?.split(' ') || ['Unknown', ''];
          const firstName = nameParts.length > 1 && nameParts[0].includes(',') 
            ? nameParts[1] 
            : nameParts[0];
          const lastName = nameParts.length > 1 && nameParts[0].includes(',')
            ? nameParts[0]
            : (nameParts[1] || '');
          
          // Determine status from assignments
          const hasActiveAssignment = d.assignments && d.assignments.length > 0;
          const status: "Available" | "On Trip" | "Off Duty" = 
            !d.isAvailable ? "Off Duty" :
            hasActiveAssignment ? "On Trip" :
            "Available";
          
          // Default canDrive based on common vehicle types (can be enhanced with actual data)
          const canDrive: ("Bus" | "Van" | "Car" | "Truck")[] = ["Bus", "Van", "Car"];
          
          return {
            id: d.id,
            firstName: firstName.trim() || 'Unknown',
            lastName: lastName.trim() || '',
            status,
            canDrive,
            lastActive: d.assignments?.[0]?.startDate || undefined,
          };
        });
      }
      return [];
    } catch (error) {
      console.error('[FleetRepo] Error fetching drivers:', error);
      return [];
    }
  },
};
