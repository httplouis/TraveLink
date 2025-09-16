export type DriverStatus = "active" | "suspended" | "archived" | "pending_verification";

export type LicenseInfo = {
  number: string;
  category: string; // e.g. "A","B","C"
  expiry: string;   // ISO date
};

export type Requirements = {
  medicalClearanceExpiry?: string;
  drugTestExpiry?: string;
  safetyTrainingExpiry?: string;
};

export type Driver = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: DriverStatus;
  photoUrl?: string;
  hiredAt: string;
  license: LicenseInfo;
  requirements?: Requirements;
  primaryVehicleId?: string | null;
  allowedVehicleTypes?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
};

export type DriverCreate = Omit<Driver, "id" | "createdAt" | "updatedAt" | "lastEditedBy">;
export type DriverUpdate = Partial<Omit<Driver, "id" | "createdAt">> & { id: string };
