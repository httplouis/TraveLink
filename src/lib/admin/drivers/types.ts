// File: src/lib/admin/drivers/types.ts

// Expanded Driver statuses
export type DriverStatus =
  | "active"
  | "on_trip"
  | "off_duty"
  | "suspended"
  | "pending_verification"
  | "archived";

export type LicenseClass = "A" | "B" | "C" | "D" | "E";

export interface Driver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;

  status: DriverStatus;
  hireDate?: string; // ISO date

  licenseNo: string;
  licenseClass: LicenseClass;
  licenseExpiryISO: string;

  assignedVehicleId?: string;
  lastCheckIn?: string;
  rating?: number; // 0–5
  notes?: string;

  avatarUrl?: string;
  docLicenseUrl?: string;
  docGovtIdUrl?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DriverFilters {
  search?: string;
  status?: DriverStatus;
  licenseClass?: LicenseClass;
}

export type DriverTab =
  | "all"
  | "available"
  | "on_trip"
  | "off_duty"
  | "suspended"
  | "expired_license"
  | "pending_verification"
  | "archived";
