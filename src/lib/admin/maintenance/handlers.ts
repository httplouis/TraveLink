"use client";

import type {
  Maintenance,
  MaintFilters,
  MaintStatus,
  NextDueTint,
} from "./maintenance.types";
import { MaintRepo, computeNextDue, uid } from "./maintenance.repo";

/* tiny helper: compute tint from explicit values */
function tintFrom(dateISO?: string, odo?: number): NextDueTint {
  const today = new Date();
  if (dateISO) {
    const d = new Date(dateISO);
    const days = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return days < 0 ? "overdue" : days <= 14 ? "soon" : "ok";
  }
  return odo != null ? "ok" : "none";
}

// ---------- LOAD ----------
export function loadMaintenance(filters: MaintFilters): Maintenance[] {
  const all = MaintRepo.all();
  const {
    q = "",
    category = "all",
    status = "all",
    due = "all",
    dateFrom,
    dateTo,
  } = filters || {};

  const qNorm = q.trim().toLowerCase();

  return all
    .filter((r) => {
      if (qNorm) {
        const hay = `${r.vehicle} ${r.vendor ?? ""} ${r.description ?? ""}`.toLowerCase();
        if (!hay.includes(qNorm)) return false;
      }
      if (category !== "all" && r.type !== category) return false;
      if (status !== "all" && r.status !== status) return false;
      if (due !== "all") {
        const t = r.nextDueTint ?? "none";
        if (t !== due) return false;
      }
      if (dateFrom && r.date && r.date < dateFrom) return false;
      if (dateTo && r.date && r.date > dateTo) return false;
      return true;
    })
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

// ---------- CREATE ----------
export function createMaintenance(
  data: Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">
): Maintenance {
  const now = new Date().toISOString();

  let next = { nextDueDateISO: data.nextDueDateISO, nextDueOdometer: data.nextDueOdometer, nextDueTint: data.nextDueTint };
  if (data.nextDueAuto !== false) {
    // auto mode
    next = computeNextDue({
      type: data.type,
      date: data.date,
      odometerAtService: data.odometerAtService ?? undefined,
    });
  } else {
    // manual mode: ensure tint
    next.nextDueTint = tintFrom(next.nextDueDateISO, next.nextDueOdometer);
  }

  const record: Maintenance = {
    ...data,
    ...next,
    id: uid("maint"),
    createdAt: now,
    updatedAt: now,
    history: [{ atISO: now, action: `Created (${data.status})`, actor: data.createdBy ?? "System" }],
  };

  const list = MaintRepo.all();
  list.unshift(record);
  MaintRepo.saveAll(list);
  return record;
}

// ---------- UPDATE ----------
export function updateMaintenance(
  id: string,
  patch: Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">
): Maintenance | undefined {
  const list = MaintRepo.all();
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) return;

  const prev = list[i];
  const now = new Date().toISOString();

  let next = {
    nextDueDateISO: patch.nextDueDateISO ?? prev.nextDueDateISO,
    nextDueOdometer: patch.nextDueOdometer ?? prev.nextDueOdometer,
    nextDueTint: patch.nextDueTint ?? prev.nextDueTint,
  };

  const auto = patch.nextDueAuto ?? prev.nextDueAuto ?? true;
  if (auto) {
    next = computeNextDue({
      type: patch.type ?? prev.type,
      date: patch.date ?? prev.date,
      odometerAtService: patch.odometerAtService ?? prev.odometerAtService ?? undefined,
    });
  } else {
    next.nextDueTint = tintFrom(next.nextDueDateISO, next.nextDueOdometer);
  }

  const nextRow: Maintenance = {
    ...prev,
    ...patch,
    ...next,
    updatedAt: now,
    history: [...(prev.history || []), { atISO: now, action: "Updated", actor: patch.createdBy ?? "System" }],
  };

  list[i] = nextRow;
  MaintRepo.saveAll(list);
  return nextRow;
}

// ---------- DELETE / EXPORT remain unchanged ----------
export function deleteMaintenance(id: string) {
  const list = MaintRepo.all().filter((r) => r.id !== id);
  MaintRepo.saveAll(list);
}

export function deleteManyMaintenance(ids: string[]) {
  if (!ids?.length) return;
  const idset = new Set(ids);
  const list = MaintRepo.all().filter((r) => !idset.has(r.id));
  MaintRepo.saveAll(list);
}

export function exportMaintenanceCSV(rows: Maintenance[]): Blob {
  const header = [
    "id","vehicle","type","status","vendor","costPhp","date",
    "nextDueDateISO","nextDueOdometer","nextDueTint","nextDueAuto",
    "odometerAtService","tireRotationApplied","createdBy","createdAt","updatedAt",
  ];
  const lines = rows.map((r) =>
    [
      r.id, r.vehicle, r.type, r.status, r.vendor ?? "", r.costPhp ?? "", r.date ?? "",
      r.nextDueDateISO ?? "", r.nextDueOdometer ?? "", r.nextDueTint ?? "", r.nextDueAuto ? "auto" : "manual",
      r.odometerAtService ?? "", r.tireRotationApplied ? "yes" : "no", r.createdBy ?? "", r.createdAt ?? "", r.updatedAt ?? "",
    ].map((v) => String(v).replace(/"/g, '""')).map((v) => `"${v}"`).join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}
