export type VehicleStatus = "available" | "in_use" | "maintenance" | "inactive";
export type DriverStatus = "available" | "on_trip" | "inactive";

export type Vehicle = {
  id: string;
  plateNo: string;
  make?: string;
  model?: string;
  type?: string;       // e.g., "Van", "Bus", "Car"
  capacity?: number;   // seats
  status: VehicleStatus;
  remarks?: string | null;
};

export type Driver = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone?: string | null;
  status: DriverStatus;
  licenseNo?: string | null;
  remarks?: string | null;
};
