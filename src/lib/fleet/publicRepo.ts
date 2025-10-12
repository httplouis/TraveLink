import { toDriverPublic, toVehiclePublic } from "./publicMappers";
import type { DriverPublic, VehiclePublic } from "./publicTypes";

// TODO: replace with your existing data reads from the admin side
async function fetchAdminVehicles(): Promise<any[]> {
  // e.g. prisma.vehicle.findMany() or supabase.from('vehicles')...
  // return [...]
  return [];
}
async function fetchAdminDrivers(): Promise<any[]> {
  return [];
}

export async function listPublicVehicles(): Promise<VehiclePublic[]> {
  const rows = await fetchAdminVehicles();
  return rows.map(toVehiclePublic);
}

export async function listPublicDrivers(): Promise<DriverPublic[]> {
  const rows = await fetchAdminDrivers();
  return rows.map(toDriverPublic);
}
