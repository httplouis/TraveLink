// src/lib/user/request/mockApi.ts
import type { RequestFormData } from "@/lib/user/request/types";
import { REASON_OPTIONS } from "@/lib/user/request/types";
import { firstReceiver, fullApprovalPath } from "@/lib/user/request/routing";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";

/* ---------- LocalStorage helpers ---------- */

const DRAFTS_KEY = "travilink_user_request_drafts";
const SUBMITS_KEY = "travilink_user_request_submissions";

function safeRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function safeWrite<T>(key: string, list: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(list));
}

/* ---------- Types ---------- */

export type Draft = {
  id: string;
  title: string;
  data: RequestFormData;
  createdAt: string;
  updatedAt: string;
};

export type Submission = {
  id: string;
  title: string;
  data: RequestFormData;
  status: "pending" | "approved" | "cancelled";
  firstReceiver: string;
  approvalPath: string[];
  createdAt: string;
  updatedAt: string;
};

/* ---------- Helpers ---------- */

const REASON_LABEL: Record<string, string> = Object.fromEntries(
  REASON_OPTIONS.map((o) => [o.value, o.label])
);

function buildTitle(data: RequestFormData) {
  const reason = REASON_LABEL[data.reason] ?? data.reason;
  const dest = data.travelOrder?.destination || "No destination";
  const dt = data.travelOrder?.date || "no date";
  return `${data.requesterRole.toUpperCase()} • ${reason} • ${dest} (${dt})`;
}

/* ---------- Drafts API ---------- */

export async function listDrafts(): Promise<Draft[]> {
  return safeRead<Draft>(DRAFTS_KEY).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  return safeRead<Draft>(DRAFTS_KEY).find((d) => d.id === id);
}

export async function deleteDraft(id: string): Promise<void> {
  const next = safeRead<Draft>(DRAFTS_KEY).filter((d) => d.id !== id);
  safeWrite<Draft>(DRAFTS_KEY, next);
}

export async function saveDraft(data: RequestFormData, draftId?: string) {
  const now = new Date().toISOString();
  const title = buildTitle(data);
  const list = safeRead<Draft>(DRAFTS_KEY);

  if (draftId) {
    const i = list.findIndex((d) => d.id === draftId);
    if (i >= 0) {
      list[i] = { ...list[i], title, data, updatedAt: now };
      safeWrite<Draft>(DRAFTS_KEY, list);
      return { id: draftId, savedAt: now };
    }
  }

  const id = crypto.randomUUID();
  list.unshift({ id, title, data, createdAt: now, updatedAt: now });
  safeWrite<Draft>(DRAFTS_KEY, list);
  return { id, savedAt: now };
}

/* ---------- Submissions API ---------- */

export async function listSubmissions(): Promise<Submission[]> {
  return safeRead<Submission>(SUBMITS_KEY).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSubmission(id: string): Promise<Submission | undefined> {
  return safeRead<Submission>(SUBMITS_KEY).find((s) => s.id === id);
}

/** Create the user-facing submission record.
 * If `forcedId` is provided, it will be used so it matches AdminRequestsRepo. */
export async function createSubmission(data: RequestFormData, forcedId?: string) {
  const now = new Date().toISOString();
  const title = buildTitle(data);
  const list = safeRead<Submission>(SUBMITS_KEY);

  const id = forcedId ?? crypto.randomUUID();

  const first = firstReceiver({
    requesterRole: data.requesterRole,
    vehicleMode: data.vehicleMode,
    reason: data.reason,
  });
  const path = fullApprovalPath({
    requesterRole: data.requesterRole,
    vehicleMode: data.vehicleMode,
  });

  const row: Submission = {
    id,
    title,
    data,
    status: "pending",
    firstReceiver: first,
    approvalPath: path,
    createdAt: now,
    updatedAt: now,
  };

  list.unshift(row);
  safeWrite<Submission>(SUBMITS_KEY, list);
  return { id, submittedAt: now };
}

export async function updateSubmission(id: string, data: RequestFormData) {
  const list = safeRead<Submission>(SUBMITS_KEY);
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) throw new Error("Submission not found");
  if (list[i].status !== "pending") throw new Error("Only pending submissions can be edited");

  const now = new Date().toISOString();
  const title = buildTitle(data);
  const first = firstReceiver({
    requesterRole: data.requesterRole,
    vehicleMode: data.vehicleMode,
    reason: data.reason,
  });
  const path = fullApprovalPath({
    requesterRole: data.requesterRole,
    vehicleMode: data.vehicleMode,
  });

  list[i] = { ...list[i], title, data, firstReceiver: first, approvalPath: path, updatedAt: now };
  safeWrite<Submission>(SUBMITS_KEY, list);
  return { id, updatedAt: now };
}

/** Cancel a pending submission:
 * - mark it as `cancelled` in user history
 * - and remove the corresponding row from AdminRequestsRepo */
export async function cancelSubmission(id: string) {
  const list = safeRead<Submission>(SUBMITS_KEY);
  const i = list.findIndex((s) => s.id === id);
  if (i >= 0) {
    list[i] = { ...list[i], status: "cancelled", updatedAt: new Date().toISOString() };
    safeWrite<Submission>(SUBMITS_KEY, list);
  }

  // Also remove from Admin list; if you prefer to keep it with 'cancelled' status,
  // replace this with a repo method that updates status instead of removing.
  const repoAny = AdminRequestsRepo as unknown as { remove?: (rid: string) => void };
  repoAny.remove?.(id);
}
