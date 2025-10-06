import { Trip } from "./types";

export const MOCK_TRIPS: Trip[] = [
  { id: "SCH-1001", start: "2025-12-25T08:00", end: "2025-12-25T12:00", vehicle: "Bus", destination: "Tagaytay", department: "CCMS", status: "Approved" },
  { id: "SCH-1002", start: "2025-12-28T09:30", end: "2025-12-28T13:30", vehicle: "Van", destination: "MSEUF Lucena", department: "COA", status: "Pending" },
  { id: "SCH-1003", start: "2026-01-10T06:15", end: "2026-01-10T10:00", vehicle: "Bus", destination: "Batangas", department: "CCJE", status: "Assigned" },
  { id: "SCH-0994", start: "2025-11-29T07:30", end: "2025-11-29T11:00", vehicle: "Car", destination: "San Pablo", department: "CHM", status: "Completed" },
];
