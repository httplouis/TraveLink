import type { Vehicle, VehicleFilters, VehicleStatus, VehicleType } from "./types";

const LS_KEY = "tl_vehicles_v1";

const nowISO = () => new Date().toISOString();
const uid = () => (globalThis.crypto?.randomUUID?.() ?? `v_${Math.random().toString(36).slice(2)}`);

const seed: Vehicle[] = [
  {
    id: uid(), plateNo: "NAB-1234", code: "BUS-01", brand: "Hyundai", model: "County",
    type: "Bus", capacity: 30, status: "active", odometerKm: 42133, lastServiceISO: "2025-08-28",
    notes: "Clean; tires ok", createdAt: nowISO(), updatedAt: nowISO(),
  },
  {
    id: uid(), plateNo: "XAC-9087", code: "VAN-03", brand: "Toyota", model: "HiAce",
    type: "Van", capacity: 12, status: "maintenance", odometerKm: 72810, lastServiceISO: "2025-09-10",
    notes: "Brake pads order", createdAt: nowISO(), updatedAt: nowISO(),
  },
  {
    id: uid(), plateNo: "QWE-5678", code: "BUS-02", brand: "Isuzu", model: "Journey",
    type: "Bus", capacity: 40, status: "active", odometerKm: 189233, lastServiceISO: "2025-08-20",
    notes: null, createdAt: nowISO(), updatedAt: nowISO(),
  },
  {
    id: uid(), plateNo: "AAA-7777", code: "CAR-01", brand: "Honda", model: "City",
    type: "Car", capacity: 4, status: "inactive", odometerKm: 32400, lastServiceISO: "2025-07-01",
    notes: "For registration", createdAt: nowISO(), updatedAt: nowISO(),
  },
];

function load(): Vehicle[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Vehicle[];
  } catch { return seed; }
}

function save(rows: Vehicle[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

export const VehiclesRepo = {
  list(filters?: VehicleFilters): Vehicle[] {
    const rows = load();
    if (!filters) return rows;
    const q = (filters.search ?? "").trim().toLowerCase();
    return rows.filter(v => {
      const okQ = !q || [
        v.plateNo, v.code, v.brand, v.model, v.type, v.status,
      ].join(" ").toLowerCase().includes(q);
      const okType = !filters.type || v.type === filters.type;
      const okStatus = !filters.status || v.status === filters.status;
      return okQ && okType && okStatus;
    });
  },

  get(id: string) { return load().find(v => v.id === id) ?? null; },

  create(data: Omit<Vehicle,"id"|"createdAt"|"updatedAt">): Vehicle {
    const next: Vehicle = { ...data, id: uid(), createdAt: nowISO(), updatedAt: nowISO() };
    const rows = load();
    rows.unshift(next);
    save(rows);
    return next;
  },

  update(id: string, patch: Partial<Vehicle>): Vehicle | null {
    const rows = load();
    const idx = rows.findIndex(r => r.id === id);
    if (idx < 0) return null;
    rows[idx] = { ...rows[idx], ...patch, updatedAt: nowISO() };
    save(rows);
    return rows[idx];
  },

  remove(id: string) {
    const rows = load().filter(r => r.id !== id);
    save(rows);
  },

  bulkRemove(ids: string[]) {
    const set = new Set(ids);
    const rows = load().filter(r => !set.has(r.id));
    save(rows);
  },

  constants: {
    types: ["Bus","Van","Car","Service"] as VehicleType[],
    statuses: ["active","maintenance","inactive"] as VehicleStatus[],
  }
};
