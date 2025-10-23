import { MaintRepo } from "./maintenance.repo";
import type {
  MaintFilters,
  MaintRecord,
  MaintStatus,
} from "./maintenance.types";

export function canTransition(from: MaintStatus, to: MaintStatus) {
  const map: Record<MaintStatus, MaintStatus[]> = {
    Submitted: ["Acknowledged", "Rejected"],
    Acknowledged: ["In-Progress", "Rejected"],
    "In-Progress": ["Completed", "Rejected"],
    Completed: [],
    Rejected: [],
  };
  return map[from].includes(to);
}

export function pushStatus(id: string, next: MaintStatus, note?: string) {
  const all = MaintRepo.list();
  const i = all.findIndex((x) => x.id === id);
  if (i < 0) throw "Record not found";

  const rec = { ...all[i] };
  if (!canTransition(rec.status, next)) {
    throw `Cannot transition from ${rec.status} to ${next}`;
  }

  const from = rec.status;
  rec.status = next;
  rec.history = rec.history || [];
  rec.history.push({
    at: new Date().toISOString(),
    by: "admin",
    from,
    to: next,
    note,
  });

  all[i] = rec;
  MaintRepo.save(all);
}

export function loadMaintenance(f: MaintFilters): MaintRecord[] {
  const all = MaintRepo.list();
  const q = (f.q || "").toLowerCase().trim();

  return all.filter((r) => {
    const matchQ =
      !q ||
      [r.description, r.vendor, r.vehicleId, r.assignedDriverId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    const matchType = f.types?.length ? f.types.includes(r.type) : true;
    const matchStatus = f.statuses?.length ? f.statuses.includes(r.status) : true;
    const matchFrom = f.from ? r.createdAt >= f.from : true;
    const matchTo = f.to ? r.createdAt <= f.to : true;

    return matchQ && matchType && matchStatus && matchFrom && matchTo;
  });
}
