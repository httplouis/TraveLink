"use client";

import type { RequestFormData } from "@/lib/user/request/types";

/* ---------- Types ---------- */

export type AdminRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type AdminRequest = {
  id: string;
  createdAt: string;  // ISO
  updatedAt: string;  // ISO
  status: AdminRequestStatus;

  driver?: string;
  vehicle?: string;

  /**
   * Flattened copies taken at submit time (for quick reads in Admin UI).
   * NOTE: travelOrder already includes requesterSignature (see types file).
   */
  travelOrder?: RequestFormData["travelOrder"];
  seminar?: RequestFormData["seminar"];
  schoolService?: RequestFormData["schoolService"];

  /** Keep the whole user payload for future editing/auditing */
  payload: RequestFormData;

  /** ✅ Approval fields (captured in admin modal) */
  approverSignature?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
};

const STORAGE_KEY = "admin.requests.v1";

/* ---------- utils ---------- */

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readAll(): AdminRequest[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as AdminRequest[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: AdminRequest[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- small pub/sub for screens that are open together ---------- */

type Unsub = () => boolean;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

/* ---------- Repo ---------- */

export const AdminRequestsRepo = {
  subscribe(cb: () => void): Unsub {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) cb();
    };
    if (isBrowser()) window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      if (isBrowser()) window.removeEventListener("storage", onStorage);
      return true;
    };
  },

  list(): AdminRequest[] {
    // newest first
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  get(id: string): AdminRequest | undefined {
    return readAll().find((x) => x.id === id);
  },

  upsert(req: AdminRequest) {
    const list = readAll();
    const i = list.findIndex((x) => x.id === req.id);
    if (i >= 0) list[i] = req;
    else list.unshift(req);
    writeAll(list);
    notify();
  },

  upsertMany(arr: AdminRequest[]) {
    const map = new Map(readAll().map((x) => [x.id, x] as const));
    for (const it of arr) map.set(it.id, it);
    writeAll([...map.values()]);
    notify();
  },

  addMany(arr: AdminRequest[]) {
    const list = readAll();
    writeAll([...arr, ...list]);
    notify();
  },

  remove(id: string) {
    const list = readAll().filter((x) => x.id !== id);
    writeAll(list);
    notify();
  },

  removeMany(ids: string[]) {
    const set = new Set(ids);
    const list = readAll().filter((x) => !set.has(x.id));
    writeAll(list);
    notify();
  },

  setDriver(id: string, driver: string) {
    const it = this.get(id);
    if (!it) return;
    it.driver = driver;
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  setVehicle(id: string, vehicle: string) {
    const it = this.get(id);
    if (!it) return;
    it.vehicle = vehicle;
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  /** Called by user form on submit */
  acceptFromUser(data: RequestFormData): string {
    const id =
      crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();

    const rec: AdminRequest = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "pending",

      // keep originals for admin views
      payload: data,
      travelOrder: data.travelOrder,       // includes requesterSignature
      seminar: data.seminar,
      schoolService: data.schoolService,

      // approval defaults
      approverSignature: null,
      approvedAt: null,
      approvedBy: null,
    };

    this.upsert(rec);
    return id;
  },

  /** ✅ Approve a request with signature (persist in localStorage). */
  approve(id: string, opts: { signature: string; approvedBy?: string | null }) {
    const it = this.get(id);
    if (!it) return;
    it.status = "approved";
    it.approverSignature = opts.signature;
    it.approvedAt = new Date().toISOString();
    it.approvedBy = opts.approvedBy ?? null;
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  /** ✅ Reject a request */
  reject(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "rejected";
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  /** ✅ Handy counts for KPI cards */
  counts() {
    const list = readAll();
    return {
      pending:  list.filter(i => i.status === "pending").length,
      approved: list.filter(i => i.status === "approved").length,
      completed:list.filter(i => i.status === "completed").length,
      rejected: list.filter(i => i.status === "rejected").length,
      cancelled:list.filter(i => i.status === "cancelled").length,
      all: list.length,
    };
  },
};
