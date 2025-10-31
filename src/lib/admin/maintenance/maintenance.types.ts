/* Central, strict types for Maintenance. Keep names you used in old code. */

export type MaintType =
  | "PMS"
  | "Repair"
  | "LTORenewal"
  | "InsuranceRenewal"
  | "Vulcanize"
  | "Other";

export type MaintStatus =
  | "Submitted"
  | "Acknowledged"
  | "In-Progress"
  | "Completed"
  | "Rejected";

/** next-due indicator used by filters and list tints */
export type NextDueTint = "ok" | "soon" | "overdue" | "none";

export type MaintAttachmentKind = "img" | "pdf";

export type MaintAttachment = {
  id: string;
  name: string;
  kind: MaintAttachmentKind; // "img" | "pdf"
  url: string;               // data: URL or http(s)
};

export type MaintHistoryItem = {
  atISO: string;
  action: string;
  actor: string;
  notes?: string;
};

export type Maintenance = {
  id: string;
  vehicle: string;
  type: MaintType;
  status: MaintStatus;

  vendor?: string;
  costPhp?: number;
  date: string; // ISO string (yyyy-mm-dd or full ISO)

  odometerAtService?: number | null;
  description?: string;

  attachments: MaintAttachment[];

  /** auto-compute next due from type/date/odometer */
  nextDueAuto?: boolean;

  /** at least one of date/odometer tint inputs may exist */
  nextDueDateISO?: string;
  nextDueOdometer?: number;
  nextDueTint?: NextDueTint;

  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  history: MaintHistoryItem[];
};

/** Filters used by FiltersBar (with “all” choice kept) */
export type MaintFilters = {
  search?: string;
  type?: MaintType | "all";
  status?: MaintStatus | "all";
  nextDueTint?: NextDueTint | "all";
};

/** Small utility used across UI to convert due → tint */
export function tintFrom(
  nextDueDateISO?: string,
  nextDueOdometer?: number | null
): NextDueTint {
  // very lightweight logic; keep identical visuals
  const now = new Date();
  if (nextDueDateISO) {
    const d = new Date(nextDueDateISO);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "overdue";
    if (diff <= 14) return "soon";
    return "ok";
  }
  if (typeof nextDueOdometer === "number") {
    // You can tune these numbers later; UI unchanged.
    if (nextDueOdometer <= 0) return "overdue";
    if (nextDueOdometer < 500) return "soon";
    return "ok";
  }
  return "none";
}
