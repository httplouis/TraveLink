export type MaintType = "Preventive" | "Repair" | "Inspection";
export type MaintStatus = "draft" | "submitted" | "acknowledged" | "in-progress" | "completed" | "rejected";

export type Maintenance = {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  plateNo: string;

  type: MaintType;
  description: string;
  odometerKm: number;
  photoUrl?: string | null;

  requestDate: string;   // ISO
  serviceDate?: string;  // ISO
  status: MaintStatus;

  remarks?: string | null;
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
};

export type MaintFilters = {
  search?: string;
  type?: "" | MaintType;
  status?: "" | MaintStatus;
};
