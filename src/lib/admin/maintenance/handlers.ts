import type { Maintenance, MaintFilters } from "./types";
import { MaintRepo } from "./repo";
import { applyFilters, validate } from "./service";
import { toCSV } from "./csv";

export function loadMaintenance(filters?: MaintFilters): Maintenance[] {
  return applyFilters(MaintRepo.all(), filters);
}

export function getMaintenance(id: string): Maintenance | null {
  return MaintRepo.byId(id);
}

export function createMaintenance(data: Omit<Maintenance,"id"|"createdAt"|"updatedAt">): Maintenance {
  const err = validate(data as any);
  if (err) throw new Error(err);
  return MaintRepo.insert(data);
}

export function updateMaintenance(id: string, data: Omit<Maintenance,"id"|"createdAt"|"updatedAt">): Maintenance | null {
  const err = validate(data as any);
  if (err) throw new Error(err);
  return MaintRepo.patch(id, data);
}

export function deleteMaintenance(id: string) {
  MaintRepo.remove(id);
}

export function deleteManyMaintenance(ids: string[]) {
  MaintRepo.bulkRemove(ids);
}

export function exportMaintenanceCSV(rows: Maintenance[]): Blob {
  const csv = toCSV(rows);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
