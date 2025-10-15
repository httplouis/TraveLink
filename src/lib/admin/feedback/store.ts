// src/lib/admin/feedback/store.ts
import type { Feedback } from "./types";
import { MOCK_FEEDBACK } from "./mock";

const STORAGE_KEY = "feedbackRepo";

function load(): Feedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Feedback[]) : [];
  } catch {
    return [];
  }
}

function save(rows: Feedback[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function ensureSeed() {
  const cur = load();
  if (!cur || cur.length === 0) {
    save(MOCK_FEEDBACK);
  }
}

export const FeedbackRepo = {
  /** Call on mount — seeds when empty */
  init() {
    ensureSeed();
  },

  list(): Feedback[] {
    ensureSeed();
    return load();
  },

  get(id: string): Feedback | undefined {
    return this.list().find((f) => f.id === id);
  },

  create(data: Omit<Feedback, "id" | "createdAt">) {
    const all = this.list();
    const fb: Feedback = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `FB-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    all.push(fb);
    save(all);
    return fb;
  },

  update(id: string, patch: Partial<Feedback>) {
    const all = this.list();
    const i = all.findIndex((f) => f.id === id);
    if (i >= 0) {
      all[i] = { ...all[i], ...patch };
      save(all);
      return all[i];
    }
    return undefined;
  },

  setStatus(id: string, status: Feedback["status"]) {
    return this.update(id, { status });
  },

  removeMany(ids: string[]) {
    const all = this.list().filter((f) => !ids.includes(f.id));
    save(all);
  },

  /** Dev helper: clear and re-seed */
  resetToMock() {
    save([]);
    ensureSeed();
    return this.list();
  },
};
