// Mock data helpers (NO auto-seed on import)
import { createMaintenance } from "./handlers";
import type {
  Maintenance,
  MaintAttachment,
  MaintStatus,
  MaintType,
} from "./maintenance.types";
import { LS_KEY } from "./maintenance.repo";

const VEHICLES = [
  "PICKUP-07 • Ford Ranger (NEO-5555)",
  "SEDAN-04 • Vios (KLM-2345)",
  "VAN-12 • Hiace (ABC-0912)",
  "SUV-01 • Fortuner (XYZ-7777)",
];
const VENDORS = [
  "QuickFix Auto",
  "Malayan Insurance",
  "LTO",
  "AutoCare Center",
];
const TYPES: MaintType[] = [
  "PMS",
  "Repair",
  "LTORenewal",
  "InsuranceRenewal",
  "VulcanizeTire",
  "Other",
];
const STATUSES: MaintStatus[] = [
  "Submitted",
  "Acknowledged",
  "In-Progress",
  "Completed",
  "Rejected",
];

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function maybe<T>(v: T, p = 0.5): T | undefined {
  return Math.random() < p ? v : undefined;
}

function randomAttachment(): MaintAttachment {
  const isPdf = Math.random() < 0.4;
  return {
    id: crypto.randomUUID(),
    name: isPdf ? "document.pdf" : "photo.jpg",
    kind: isPdf ? "pdf" : "image",
    url: "data:,", // stub
  };
}

function randomRecord(): Omit<
  Maintenance,
  "id" | "createdAt" | "updatedAt" | "history"
> {
  const type = rand(TYPES);
  const status = rand(STATUSES);
  const date = new Date();
  date.setDate(date.getDate() - randInt(0, 60));
  const nextInDays = randInt(-5, 45);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextInDays);

  return {
    vehicle: rand(VEHICLES),
    type,
    status,
    date: date.toISOString().slice(0, 10),
    vendor: rand(VENDORS),
    costPhp: Math.random() < 0.4 ? randInt(0, 5000) : 0,
    description: "Auto-generated sample record",
    odometerAtService: maybe(randInt(10000, 180000)),
    tireRotationApplied: Math.random() < 0.3,
    attachments: Math.random() < 0.5 ? [randomAttachment()] : [],
    nextDueDateISO: Math.random() < 0.8 ? nextDate.toISOString() : undefined,
    nextDueOdometer:
      Math.random() < 0.3 ? randInt(10000, 200000) : undefined,
    nextDueTint:
      nextInDays < 0 ? "overdue" : nextInDays < 14 ? "soon" : "ok",
    createdBy: "Transport Office",
    assignedDriverId: undefined,
  };
}

/** Seed N random maintenance records (does not clear existing) */
export function seedMockMaintenance(n = 10) {
  for (let i = 0; i < n; i++) createMaintenance(randomRecord());
}

/** Clear all maintenance records */
export function clearAllMaintenance() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

/** Back-compat alias (some older code imported this) */
export function buildDemoMaintenance() {
  return randomRecord();
}
