import { Driver, DriverStatus, Schedule, Vehicle, VehicleStatus } from "@/lib/types";

export interface VehiclesPort {
  list(): Promise<Vehicle[]>;
  updateStatus(id: string, status: VehicleStatus): Promise<void>;
  add(v: Vehicle): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface DriversPort {
  list(): Promise<Driver[]>;
  updateStatus(id: string, status: DriverStatus): Promise<void>;
  add(d: Driver): Promise<void>;
}

export interface SchedulesPort {
  listUpcoming(): Promise<Schedule[]>;
}

export interface Api {
  vehicles: VehiclesPort;
  drivers: DriversPort;
  schedules: SchedulesPort;
}
