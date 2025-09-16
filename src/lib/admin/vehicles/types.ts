export type VehicleType = "Bus" | "Van" | "Car" | "Service";
export type VehicleStatus = "active" | "maintenance" | "inactive";

export type Vehicle = {
  id: string;
  plateNo: string;
  code: string;          // e.g., BUS-01
  brand: string;
  model: string;
  type: VehicleType;
  capacity: number;
  status: VehicleStatus;
  odometerKm: number;
  lastServiceISO: string; // ISO date
  notes?: string | null;
  createdAt: string;      // ISO
  updatedAt: string;      // ISO
};

export type VehicleFilters = {
  search?: string;
  type?: "" | VehicleType;
  status?: "" | VehicleStatus;
};
