export type DayStatus = "available" | "partial" | "full";

export type Status = "Pending" | "Approved" | "Assigned" | "Rejected" | "Completed";

export type Trip = {
  id: string;
  destination: string;
  vehicle: string;
  department: string;
  status: Status;
  start: string;
  end: string;
};
