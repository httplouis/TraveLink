// src/lib/admin/requests/store.ts
"use client";

import type { RequestFormData } from "@/lib/user/request/types";

/* ---------- Types ---------- */

export type AdminRequestStatus =
  | "pending"          // legacy direct-to-admin
  | "pending_head"     // awaiting Department Head endorsement
  | "head_approved"    // endorsed by head; forward to Admin
  | "head_rejected"    // rejected by head
  | "admin_received"   // optional: queued in Admin
  // ── Routed stages after Admin approves & signs ──
  | "comptroller_pending" // budget check / edits
  | "hr_pending"          // HR sign-off
  | "executive_pending"   // Executive final sign-off
  // ── Terminal-ish ──
  | "approved"         // final approved (after executive)
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

  /** ✅ Admin (Ma'am TM) approval fields */
  approverSignature?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;

  /** 🧾 Comptroller sign-off (budget check / edit) */
  comptrollerSignature?: string | null;
  comptrollerAt?: string | null;
  comptrollerBy?: string | null;

  /** 👥 HR sign-off */
  hrSignature?: string | null;
  hrAt?: string | null;
  hrBy?: string | null;

  /** 🏛️ Executive final sign-off */
  executiveSignature?: string | null;
  executiveAt?: string | null;
  executiveBy?: string | null;

  /** 📝 Optional notes (e.g., Ma'am TM note when renting vehicle) */
  tmNote?: string | null;
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

  setTmNote(id: string, note: string | null) {
    const it = this.get(id);
    if (!it) return;
    it.tmNote = note ?? null;
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  /** Called by user form on submit (legacy direct-to-admin path) */
  acceptFromUser(data: RequestFormData): string {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
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

      comptrollerSignature: null,
      comptrollerAt: null,
      comptrollerBy: null,

      hrSignature: null,
      hrAt: null,
      hrBy: null,

      executiveSignature: null,
      executiveAt: null,
      executiveBy: null,

      tmNote: null,
    };

    this.upsert(rec);
    return id;
  },

  /** Legacy: one-step approve (kept for backward compatibility) */
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

  /** ✅ New: Admin approves and **routes** to the next stage */
  adminApproveAndRoute(
    id: string,
    opts: { signature: string; approvedBy?: string | null; requiresComptroller: boolean }
  ) {
    const it = this.get(id);
    if (!it) return;
    const now = new Date().toISOString();
    it.approverSignature = opts.signature;
    it.approvedAt = now;
    it.approvedBy = opts.approvedBy ?? null;
    it.updatedAt = now;
    it.status = opts.requiresComptroller ? "comptroller_pending" : "hr_pending";
    this.upsert(it);
  },

  /** Comptroller approves (and forwards to HR) */
  comptrollerApprove(id: string, opts: { signature: string; by?: string | null }) {
    const it = this.get(id);
    if (!it) return;
    const now = new Date().toISOString();
    it.comptrollerSignature = opts.signature;
    it.comptrollerBy = opts.by ?? null;
    it.comptrollerAt = now;
    it.updatedAt = now;
    it.status = "hr_pending";
    this.upsert(it);
  },

  /** HR approves (and forwards to Executive) */
  hrApprove(id: string, opts: { signature: string; by?: string | null }) {
    const it = this.get(id);
    if (!it) return;
    const now = new Date().toISOString();
    it.hrSignature = opts.signature;
    it.hrBy = opts.by ?? null;
    it.hrAt = now;
    it.updatedAt = now;
    it.status = "executive_pending";
    this.upsert(it);
  },

  /** Executive final approval (marks overall as approved) */
  executiveApprove(id: string, opts: { signature: string; by?: string | null }) {
    const it = this.get(id);
    if (!it) return;
    const now = new Date().toISOString();
    it.executiveSignature = opts.signature;
    it.executiveBy = opts.by ?? null;
    it.executiveAt = now;
    it.updatedAt = now;
    it.status = "approved";
    this.upsert(it);
  },

  /** Simple state moves (useful for queues) */
  routeToHead(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "pending_head";
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  routeToAdmin(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "admin_received";
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  routeToComptroller(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "comptroller_pending";
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  routeToHR(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "hr_pending";
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  routeToExecutive(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "executive_pending";
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

  markCompleted(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "completed";
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  cancel(id: string) {
    const it = this.get(id);
    if (!it) return;
    it.status = "cancelled";
    it.updatedAt = new Date().toISOString();
    this.upsert(it);
  },

  /** ✅ Handy counts for KPI cards */
  counts() {
    const list = readAll();
    return {
      // Treat flow states as "pending-like" for dashboards
      pending: list.filter(i =>
        i.status === "pending" ||
        i.status === "pending_head" ||
        i.status === "head_approved" ||
        i.status === "admin_received" ||
        i.status === "comptroller_pending" ||
        i.status === "hr_pending" ||
        i.status === "executive_pending"
      ).length,
      approved:  list.filter(i => i.status === "approved").length,
      completed: list.filter(i => i.status === "completed").length,
      rejected:  list.filter(i => i.status === "rejected" || i.status === "head_rejected").length,
      cancelled: list.filter(i => i.status === "cancelled").length,
      all:       list.length,
    };
  },
};
