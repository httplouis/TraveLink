// src/lib/admin/maintenance/types.ts
export type MaintStatus = "Submitted" | "In-Progress" | "Completed" | "Rejected";

export type MaintType =
  | "PMS"
  | "Repair"
  | "LTORenewal"
  | "InsuranceRenewal"
  | "Registration"
  | (string & {});

export type NextDueTint = "ok" | "soon" | "overdue";

export type MaintAttachment = {
  id: string;
  kind: "img" | "pdf";
  name: string;
  url?: string;
};

export type MaintHistoryItem = {
  id: string;
  atISO: string;
  actor: string;
  action: string;
  notes?: string;
};

export type Maintenance = {
  id: string;
  vehicle: string;
  type: MaintType;
  status: MaintStatus;
  vendor: string;
  costPhp: number;
  date: string; // ISO
  odometerAtService?: number;
  description: string;
  attachments: MaintAttachment[];

  nextDueAuto: boolean;
  nextDueDateISO?: string;
  nextDueOdometer?: number;
  nextDueTint: NextDueTint;

  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  history: MaintHistoryItem[];
};

/** Simple helper used by handlers to compute tint from a due date. */
export function tintFrom(dueISO?: string): NextDueTint {
  if (!dueISO) return "ok";
  const today = new Date();
  const due = new Date(dueISO);
  // normalize to midnight
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((+due - +today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 14) return "soon";
  return "ok";
}
