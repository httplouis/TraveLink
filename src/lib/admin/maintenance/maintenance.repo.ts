"use client";

import type {
  Maintenance,
  MaintStatus,
  MaintType,
  NextDueTint,
} from "./maintenance.types";

export const LS_KEY = "travilink:admin:maintenance:v2";

// -------- storage helpers --------
function read(): Maintenance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Maintenance[]) : [];
  } catch {
    return [];
  }
}

function write(list: Maintenance[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

// tiny uid helper used by attachments, etc.
export function uid(prefix = "m"): string {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Math.random().toString(36).slice(2)}`;
  }
}

// Public minimal repo API (kept for compatibility)
export const MaintRepo = {
  all(): Maintenance[] {
    return read();
  },
  saveAll(list: Maintenance[]) {
    write(list);
  },
  find(id: string): Maintenance | undefined {
    return read().find((r) => r.id === id);
  },
  setStatus(id: string, status: MaintStatus) {
    const list = read();
    const i = list.findIndex((r) => r.id === id);
    if (i >= 0) {
      const now = new Date().toISOString();
      list[i] = {
        ...list[i],
        status,
        updatedAt: now,
        history: [
          ...(list[i].history || []),
          { atISO: now, action: `Status changed to ${status}`, actor: "System" },
        ],
      };
      write(list);
    }
  },
  clear() {
    write([]);
  },
};

// -------- business logic: next due computation --------
export function computeNextDue(src: {
  type: MaintType;
  date?: string;
  odometerAtService?: number;
}): Pick<Maintenance, "nextDueDateISO" | "nextDueOdometer" | "nextDueTint"> {
  let nextDate: Date | undefined;
  let nextOdo: number | undefined;

  const startDate = src.date ? new Date(src.date) : undefined;

  switch (src.type) {
    case "PMS":
      if (startDate) {
        nextDate = new Date(startDate);
        nextDate.setMonth(nextDate.getMonth() + 6); // 6 months
      }
      if (src.odometerAtService != null) nextOdo = src.odometerAtService + 10000; // +10k km
      break;
    case "LTORenewal":
    case "InsuranceRenewal":
      if (startDate) {
        nextDate = new Date(startDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1); // yearly
      }
      break;
    case "VulcanizeTire":
    case "Repair":
    case "Other":
    default:
      // no default schedule
      break;
  }

  let tint: NextDueTint = "none";
  const today = new Date();

  if (nextDate) {
    const days = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
    tint = days < 0 ? "overdue" : days <= 14 ? "soon" : "ok";
  } else if (nextOdo != null) {
    // If only odometer is present, keep it visible but neutral/ok
    tint = "ok";
  }

  return {
    nextDueDateISO: nextDate ? nextDate.toISOString() : undefined,
    nextDueOdometer: nextOdo,
    nextDueTint: tint,
  };
}
