// src/lib/admin/requests/store.ts
"use client";

import type { RequestFormData } from "@/lib/user/request/types";
import { fetchRequests, fetchRequest, approveRequest, rejectRequest } from "./api";

/* ---------- Types ---------- */

export type AdminRequestStatus =
  | "pending"            // user → legacy direct to admin
  | "pending_head"       // user (faculty) → waiting for dept head
  | "pending_admin"      // head approved → waiting for admin
  | "head_approved"      // head endorsed → send to admin
  | "head_rejected"
  | "admin_received"     // nasa admin queue (Ma’am TM / Cleofe)
  | "comptroller_pending"// budget check / edits
  | "hr_pending"         // HR sign-off
  | "executive_pending"  // VP / Pres sign-off
  | "approved"           // final ok, balik kay TM & requester
  | "rejected"
  | "completed"
  | "cancelled";

export type AdminRequest = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: AdminRequestStatus;

  // Department and requester info for proper routing
  department?: string; // Full department name
  departmentCode?: string; // Short code (e.g., "CNAHS")
  requesterName?: string; // Requester's full name
  requesterEmail?: string; // Requester's email
  requestNumber?: string; // e.g., "TO-2025-001"

  driver?: string;
  vehicle?: string;

  travelOrder?: RequestFormData["travelOrder"];
  seminar?: RequestFormData["seminar"];
  schoolService?: RequestFormData["schoolService"];

  payload: RequestFormData;

  // Admin (Ma’am TM)
  approverSignature?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;

  // Comptroller
  comptrollerSignature?: string | null;
  comptrollerAt?: string | null;
  comptrollerBy?: string | null;

  // HR
  hrSignature?: string | null;
  hrAt?: string | null;
  hrBy?: string | null;

  // Executive
  executiveSignature?: string | null;
  executiveAt?: string | null;
  executiveBy?: string | null;

  // Notes (for rent, owned, etc.)
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

/* ---------- pub/sub ---------- */

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
    // TODO: Migrate to API - see api.ts for ready implementation
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  get(id: string): AdminRequest | undefined {
    // TODO: Migrate to API - see api.ts for ready implementation
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

  // user submit → admin inbox
  acceptFromUser(data: RequestFormData): string {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();

    const rec: AdminRequest = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      payload: data,
      travelOrder: data.travelOrder,
      seminar: data.seminar,
      schoolService: data.schoolService,
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

  // legacy one-step approve
  approve(id: string, opts: { signature: string; approvedBy?: string | null }) {
    const it = this.get(id);
    if (!it) return;
    const now = new Date().toISOString();
    it.status = "approved";
    it.approverSignature = opts.signature;
    it.approvedAt = now;
    it.approvedBy = opts.approvedBy ?? null;
    it.updatedAt = now;
    this.upsert(it);
  },

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

  counts() {
    const list = readAll();
    return {
      pending: list.filter((i) =>
        [
          "pending",
          "pending_head",
          "head_approved",
          "admin_received",
          "comptroller_pending",
          "hr_pending",
          "executive_pending",
        ].includes(i.status)
      ).length,
      approved: list.filter((i) => i.status === "approved").length,
      completed: list.filter((i) => i.status === "completed").length,
      rejected: list.filter((i) => i.status === "rejected" || i.status === "head_rejected").length,
      cancelled: list.filter((i) => i.status === "cancelled").length,
      all: list.length,
    };
  },
};
