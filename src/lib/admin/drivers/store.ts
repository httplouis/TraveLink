"use client";
import type { Driver, DriverCreate, DriverUpdate } from "./types";
import { validateDriver } from "./validators";
import { todayISO } from "./utils";

const KEY = "tl::drivers";

const now = () => new Date().toISOString();

const safeLoad = (): Driver[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
};
const safeSave = (rows: Driver[]) => { if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(rows)); };

function seedIfEmpty() {
  const rows = safeLoad();
  if (rows.length) return;
  const demo: Driver[] = [
    {
      id: crypto.randomUUID(),
      employeeNo: "DRV-0001",
      firstName: "Mario",
      lastName: "Santos",
      email: "mario.santos@mseuf.edu.ph",
      phone: "09171234567",
      status: "active",
      hiredAt: todayISO(),
      photoUrl: "",
      license: { number: "ABC12345", category: "B", expiry: todayISO() },
      requirements: {},
      primaryVehicleId: null,
      allowedVehicleTypes: ["van", "bus", "car"],
      notes: "",
      createdAt: now(),
      updatedAt: now(),
    },
  ];
  safeSave(demo);
}
seedIfEmpty();

export const DriversRepo = {
  list(query?: { search?: string; status?: string; compliant?: "ok"|"warn"|"bad"|"" }) {
    let rows = safeLoad();
    if (query?.search) {
      const q = query.search.toLowerCase();
      rows = rows.filter(r =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.employeeNo.toLowerCase().includes(q) ||
        r.license.number.toLowerCase().includes(q)
      );
    }
    if (query?.status) rows = rows.filter(r => r.status === query.status);
    if (query?.compliant) {
      const { complianceState } = require("./utils");
      rows = rows.filter(r => complianceState(r) === query.compliant);
    }
    return rows.sort((a,b)=>a.lastName.localeCompare(b.lastName));
  },

  create(input: DriverCreate): Driver {
    validateDriver(input);
    const rows = safeLoad();
    const d: Driver = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now(),
      updatedAt: now(),
    };
    rows.push(d);
    safeSave(rows);
    return d;
  },

  update(patch: DriverUpdate): Driver {
    const rows = safeLoad();
    const i = rows.findIndex(r => r.id === patch.id);
    if (i < 0) throw new Error("Driver not found");
    const next = { ...rows[i], ...patch, updatedAt: now() };
    rows[i] = next;
    safeSave(rows);
    return next;
  },

  remove(id: string) {
    const rows = safeLoad().filter(r => r.id !== id);
    safeSave(rows);
  },

  bulkUpdate(ids: string[], patch: Partial<Driver>) {
    const rows = safeLoad().map(r => ids.includes(r.id) ? { ...r, ...patch, updatedAt: now() } : r);
    safeSave(rows);
  },

  exportCsv(rows: Driver[]) {
    const header = ["employeeNo","firstName","lastName","email","phone","status","licenseNumber","licenseCategory","licenseExpiry"];
    const lines = rows.map(r => [
      r.employeeNo, r.firstName, r.lastName, r.email, r.phone, r.status,
      r.license.number, r.license.category, r.license.expiry
    ].map(v => `"${(v ?? "").toString().replace(/"/g,'""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `drivers-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
};
