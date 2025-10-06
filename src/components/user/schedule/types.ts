// Shared types for faculty screens

export type Vehicle = "Car" | "Van" | "Bus";
export type Status = "Pending" | "Approved" | "Assigned" | "Completed" | "Rejected";

export type Trip = {
  id: string;
  start: string;     // ISO
  end: string;       // ISO
  vehicle: Vehicle;
  destination: string;
  note?: string;
  status: Status;
};
