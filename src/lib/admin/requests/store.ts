// src/lib/admin/requests/store.ts
import type { RequestFormData } from "@/lib/user/request/types";

export type AdminRequest = RequestFormData & {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "completed";
  driver?: string;
  vehicle?: string;
};

const KEY = "tl.admin.requests";

function read(): AdminRequest[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as AdminRequest[];
  } catch {
    return [];
  }
}

function write(rows: AdminRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export const AdminRequestsRepo = {
  list(): AdminRequest[] {
    return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  get(id: string): AdminRequest | undefined {
    return read().find((r) => r.id === id);
  },
  upsert(row: AdminRequest) {
    const rows = read();
    const i = rows.findIndex((r) => r.id === row.id);
    if (i >= 0) rows[i] = row;
    else rows.unshift(row);
    write(rows);
  },
  setStatus(id: string, status: AdminRequest["status"]) {
    const rows = read();
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) {
      rows[i].status = status;
      write(rows);
    }
  },
  setDriver(id: string, driver: string) {
    const rows = read();
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) {
      rows[i].driver = driver;
      write(rows);
    }
  },
  setVehicle(id: string, vehicle: string) {
    const rows = read();
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) {
      rows[i].vehicle = vehicle;
      write(rows);
    }
  },

  // Save user submission into Admin side repo
  acceptFromUser(payload: RequestFormData) {
    const req: AdminRequest = {
      ...payload, // copy lahat (reason, vehicleMode, requesterRole, travelOrder, seminar, schoolService)
      id: "RQ-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    const rows = read();
    rows.unshift(req);
    write(rows);
    return req.id;
  },
};
