/* -------------------------------------------------------------------------------------------------
 * Maintenance domain types
 * ------------------------------------------------------------------------------------------------*/

export type UID = string;

/** Attachment stored on a maintenance record */
export type MaintAttachment = {
  id: UID;
  /** File name shown to users */
  name: string;
  /** Used for rendering the proper badge / preview */
  kind: "image" | "pdf";
  /** Data URL or remote URL */
  url: string;
};

/** Supported maintenance kinds (UI badges & filters rely on these literal values) */
export const MAINT_TYPES = [
  "PMS",
  "Repair",
  "LTORenewal",
  "InsuranceRenewal",
  "Vulcanize",
  "Other",
] as const;
export type MaintType = (typeof MAINT_TYPES)[number];

/** Workflow status values (table chips & filters rely on these literal values) */
export const MAINT_STATUSES = [
  "Submitted",
  "Acknowledged",
  "In-Progress",
  "Completed",
  "Rejected",
] as const;
export type MaintStatus = (typeof MAINT_STATUSES)[number];

/** “Next due” visual state used by filters and badges */
export type NextDueTint = "ok" | "soon" | "overdue" | "none";

/** Activity log entry */
export type MaintHistoryItem = {
  atISO: string;         // when
  action: string;        // e.g. "Created (Submitted)"
  actor: string;         // e.g. "Transport Office"
  notes?: string;
};

/**
 * Core record.
 * NOTE: Several fields are optional to allow progressive entry.
 * UI components should gracefully handle undefined values.
 */
export type Maintenance = {
  id: UID;

  // Basic info
  vehicle: string;
  type: MaintType;
  status: MaintStatus;
  date?: string;                 // YYYY-MM-DD (ISO date only)

  vendor?: string;
  costPhp?: number;
  odometerAtService?: number;
  tireRotationApplied?: boolean;

  description?: string;
  attachments?: MaintAttachment[];

  createdBy?: string;
  assignedDriverId?: string;

  // Computed / manual next-due information
  /**
   * If true (default), the system will compute next due values
   * using business rules. If false, user-provided manual fields
   * below are respected.
   */
  nextDueAuto?: boolean;         // <- NEW FLAG

  nextDueDateISO?: string;       // YYYY-MM-DD
  nextDueOdometer?: number;      // km
  nextDueTint?: NextDueTint;

  // Metadata
  createdAt?: string;            // ISO datetime
  updatedAt?: string;            // ISO datetime
  history?: MaintHistoryItem[];
};

/** Quick filtering model used by the list page */
export type MaintFilters = {
  q?: string;
  category?: MaintType | "all";
  status?: MaintStatus | "all";
  due?: NextDueTint | "all";
  dateFrom?: string;             // YYYY-MM-DD
  dateTo?: string;               // YYYY-MM-DD
  density?: "comfortable" | "compact";
};

/* -------------------------------------------------------------------------------------------------
 * Extra types referenced elsewhere
 * ------------------------------------------------------------------------------------------------*/

/** Minimal Driver shape used by demo repos / lookups */
export type Driver = {
  id: UID;
  name: string;
};

/** Helper: function result when computing next-due values */
export type NextDueComputation = {
  nextDueDateISO?: string;
  nextDueOdometer?: number;
  nextDueTint: NextDueTint;
};
