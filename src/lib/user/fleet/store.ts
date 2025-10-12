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

const VEHICLES: Vehicle[] = [
  { id: "v1", code: "Bus 12", plate: "ABC-1234", type: "Bus", seats: 45, status: "available" },
  { id: "v2", code: "Van 03", plate: "XYZ-9087", type: "Van", seats: 12, status: "assigned" },
  { id: "v3", code: "Car 07", plate: "EUA-2025", type: "Car", seats: 4, status: "maintenance" },
];

const DRIVERS: Driver[] = [
  { id: "d1", firstName: "Jolo", lastName: "Rosales", status: "Available", canDrive: ["Bus", "Van"], lastActive: "2025-10-10T08:35:00Z" },
  { id: "d2", firstName: "Alex", lastName: "Cruz", status: "On Trip", canDrive: ["Van", "Car"], lastActive: "2025-10-10T07:10:00Z" },
  { id: "d3", firstName: "Mia",  lastName: "Santos", status: "Off Duty", canDrive: ["Car"], lastActive: "2025-10-09T18:00:00Z" },
];

export const FleetRepo = {
  listVehicles: () => [...VEHICLES],
  listDrivers:  () => [...DRIVERS],
};
