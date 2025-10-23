import type { MaintFilters, MaintRecord } from "./maintenance.types";

const KEY = "travilink_maintenance_records";
const FKEY = "travilink_maintenance_filters";

let memory: MaintRecord[] = [];
let memoryFilters: MaintFilters | null = null;

function canLS() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export const MaintRepo = {
  list(): MaintRecord[] {
    if (canLS()) {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as MaintRecord[]) : [];
    }
    return memory;
  },

  save(items: MaintRecord[]) {
    if (canLS()) localStorage.setItem(KEY, JSON.stringify(items));
    else memory = items;
  },

  upsert(rec: MaintRecord) {
    const all = this.list();
    const i = all.findIndex((x) => x.id === rec.id);
    if (i >= 0) all[i] = rec;
    else all.unshift(rec);
    this.save(all);
  },

  removeMany(ids: string[]) {
    const all = this.list().filter((r) => !ids.includes(r.id));
    this.save(all);
  },

  saveFilters(f: MaintFilters) {
    if (canLS()) localStorage.setItem(FKEY, JSON.stringify(f));
    else memoryFilters = f;
  },

  loadFilters(): MaintFilters {
    if (canLS()) {
      const raw = localStorage.getItem(FKEY);
      if (raw) return JSON.parse(raw) as MaintFilters;
    } else if (memoryFilters) {
      return memoryFilters;
    }
    return {
      q: "",
      types: [],
      statuses: [],
      density: "comfortable",
    };
  },
};
