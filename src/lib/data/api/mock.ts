import { Api } from "./ports";
import { seedDrivers, seedSchedules, seedVehicles } from "@/lib/data/admin/seeds";
import { Driver, DriverStatus, Vehicle, VehicleStatus } from "@/lib/types";

let vehicles = [...seedVehicles];
let drivers = [...seedDrivers];
let schedules = [...seedSchedules];

export const mockApi: Api = {
  vehicles: {
    async list() { return vehicles; },
    async updateStatus(id: string, status: VehicleStatus) {
      vehicles = vehicles.map(v => v.id === id ? { ...v, status, note: status === "maintenance" ? "Under maintenance" : undefined } : v);
    },
    async add(v: Vehicle) { vehicles = [v, ...vehicles]; },
    async remove(id: string) { vehicles = vehicles.filter(v => v.id !== id); },
  },
  drivers: {
    async list() { return drivers; },
    async updateStatus(id: string, status: DriverStatus) {
      drivers = drivers.map(d => d.id === id ? { ...d, status } : d);
    },
    async add(d: Driver) { drivers = [d, ...drivers]; },
  },
  schedules: {
    async listUpcoming() { return schedules; },
  },
};
