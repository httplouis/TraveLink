// src/lib/admin/maintenance/handlers.ts
"use client";

import { query, upsert, patch, remove, removeMany, exportCSV, computeNextDue, uid } from "./maintenance.repo";
import type { Maintenance } from "./types";
import { tintFrom } from "./types";

/** Read */
export function loadMaintenance(): Maintenance[] {
  return query().map(computeNextDue);
}

/** Create */
export function createMaintenance(
  data: Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">
): Maintenance {
  return upsert({ ...data, id: undefined, history: [] });
}

/** Update (full/partial via patch) */
export function updateMaintenance(
  id: string,
  data: Partial<Omit<Maintenance, "id" | "createdAt" | "history">>
): Maintenance | undefined {
  return patch(id, data);
}

/** Delete one / many */
export const deleteMaintenance = remove;
export const deleteManyMaintenance = removeMany;

/** Export helpers */
export function exportMaintenanceCSV(rows: Maintenance[]): string {
  return exportCSV(rows);
}

/** Misc passthroughs used elsewhere */
export { computeNextDue, uid, tintFrom };
