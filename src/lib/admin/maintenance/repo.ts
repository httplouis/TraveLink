import type { Maintenance } from "./types";

const LS_KEY = "tl_maintenance_v2";
const nowISO = () => new Date().toISOString();
const uid = () => (globalThis.crypto?.randomUUID?.() ?? `m_${Math.random().toString(36).slice(2)}`);

const seed: Maintenance[] = [
  {
    id: uid(), vehicleId: "v1", vehicleCode: "BUS-01", plateNo: "NAB-1234",
    type: "Preventive", description: "Oil change & tire rotation", odometerKm: 42133,
    requestDate: "2025-09-05", serviceDate: "2025-09-07", status: "completed",
    remarks: "Partner shop", photoUrl: null, createdAt: nowISO(), updatedAt: nowISO()
  },
  {
    id: uid(), vehicleId: "v2", vehicleCode: "VAN-03", plateNo: "XAC-9087",
    type: "Repair", description: "Brake pads replacement", odometerKm: 72810,
    requestDate: "2025-09-10", status: "in-progress",
    remarks: "", photoUrl: null, createdAt: nowISO(), updatedAt: nowISO()
  },
];

function loadRaw(): Maintenance[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) { localStorage.setItem(LS_KEY, JSON.stringify(seed)); return seed; }
  try { return JSON.parse(raw) as Maintenance[]; } catch { return seed; }
}
function saveRaw(rows: Maintenance[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export const MaintRepo = {
  all(): Maintenance[] { return loadRaw(); },
  byId(id: string): Maintenance | null { return loadRaw().find(r => r.id === id) ?? null; },
  insert(data: Omit<Maintenance,"id"|"createdAt"|"updatedAt">): Maintenance {
    const rows = loadRaw();
    const rec: Maintenance = { ...data, id: uid(), createdAt: nowISO(), updatedAt: nowISO() };
    rows.unshift(rec); saveRaw(rows); return rec;
  },
  patch(id: string, patch: Partial<Maintenance>): Maintenance | null {
    const rows = loadRaw();
    const i = rows.findIndex(r => r.id === id); if (i < 0) return null;
    rows[i] = { ...rows[i], ...patch, updatedAt: nowISO() };
    saveRaw(rows); return rows[i];
  },
  remove(id: string) { saveRaw(loadRaw().filter(r => r.id !== id)); },
  bulkRemove(ids: string[]) { const set = new Set(ids); saveRaw(loadRaw().filter(r => !set.has(r.id))); }
};
