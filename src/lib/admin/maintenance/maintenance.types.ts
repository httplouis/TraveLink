export type UUID = string;

export type MaintType =
  | "Preventive (PMS)"
  | "Repair"
  | "LTO Renewal"
  | "Insurance Renewal"
  | "Vulcanize/Tire"
  | "Other";

export type MaintStatus =
  | "Submitted"
  | "Acknowledged"
  | "In-Progress"
  | "Completed"
  | "Rejected";

export type Density = "comfortable" | "compact";

export type Attachment = {
  id: UUID;
  name: string;
  url: string;
  mime: string;
  size: number;
};

export type MaintHistoryEntry = {
  at: string;
  by: string;
  from: MaintStatus;
  to: MaintStatus;
  note?: string;
};

export type MaintRecord = {
  id: UUID;
  vehicleId: UUID;
  type: MaintType;
  status: MaintStatus;
  createdAt: string;
  createdBy: string;
  description?: string;
  odometer?: number;
  cost?: number;
  vendor?: string;
  nextDueDate?: string;
  assignedDriverId?: UUID;
  attachments: Attachment[];
  history: MaintHistoryEntry[];
};

export type MaintFilters = {
  q: string;
  types: MaintType[];
  statuses: MaintStatus[];
  density: Density;
  from?: string;
  to?: string;
  vehicleIds?: UUID[];
  driverIds?: UUID[];
};

export type Vehicle = { id: UUID; plate?: string; name?: string };
export type Driver = { id: UUID; name: string; badge?: string };
