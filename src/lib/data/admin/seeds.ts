import { Driver, Schedule, Vehicle } from "@/lib/types";

export const seedVehicles: Vehicle[] = [
  { id: "v1", name: "Bus 1", type: "Bus", status: "available" },
  { id: "v2", name: "Van 1", type: "Van", status: "maintenance", note: "Under maintenance" },
  { id: "v3", name: "Bus 2", type: "Bus", status: "available" },
  { id: "v4", name: "Car 3", type: "Car", status: "available" },
  { id: "v5", name: "Bus 3", type: "Bus", status: "available" },
];

export const seedDrivers: Driver[] = [
  { id: "d1", name: "Jolo Rosales", license: "Professional", vehicleTypes: ["Bus"], status: "available", phone: "09xx-xxx-xxxx", color: "#7A0010" },
  { id: "d2", name: "Mara Santos", license: "Professional", vehicleTypes: ["Van", "Car"], status: "on_trip", phone: "09xx-xxx-xxxx", color: "#0E7490" },
  { id: "d3", name: "Ken Alvarez", license: "Non-Prof", vehicleTypes: ["Car"], status: "off_duty", phone: "09xx-xxx-xxxx", color: "#4F46E5" },
  { id: "d4", name: "Ivy Dela Cruz", license: "Professional", vehicleTypes: ["Bus", "Van"], status: "available", phone: "09xx-xxx-xxxx", color: "#16A34A" },
  { id: "d5", name: "Rico Medina", license: "Professional", vehicleTypes: ["Van"], status: "sick", phone: "09xx-xxx-xxxx", color: "#EA580C" },
];

export const seedSchedules: Schedule[] = [
  { id: "s1", dept: "Hans / CCMS", purpose: "Seminar event", date: "2025-12-25", location: "Tagaytay", vehicle: "Bus", driver: "Jolo Rosales", status: "Approved" },
  { id: "s2", dept: "HR / MAIN", purpose: "Campus tour", date: "2025-12-28", location: "MSEUF Lucena", vehicle: "Van", status: "Pending" },
  { id: "s3", dept: "ENG / ME", purpose: "Field trip", date: "2026-01-10", location: "Batangas", vehicle: "Bus", status: "Assigned" },
  { id: "s4", dept: "Registrar", purpose: "Docs run", date: "2026-01-12", location: "City Hall", vehicle: "Car", status: "Pending" },
];
