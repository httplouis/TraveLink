// lib/user/request/mockApi.ts
// COMPLETE FILE — handles drafts + submissions

import type { RequestFormData } from "@/lib/user/request/types";
import { firstReceiver, fullApprovalPath } from "@/lib/user/request/routing";

const DRAFTS_KEY = "travilink_user_request_drafts";
const SUBMITS_KEY = "travilink_user_request_submissions";

export type Draft = {
  id: string;
  title: string;
  data: RequestFormData;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type Submission = {
  id: string;
  title: string;
  data: RequestFormData;
  status: "pending" | "approved" | "cancelled";
  firstReceiver: string;
  approvalPath: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

// ---------- helpers
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

function buildTitle(data: RequestFormData) {
  return `${data.requesterRole.toUpperCase()} • ${data.reason} • ${data.travelOrder?.destination || "No destination"} (${data.travelOrder?.date || "no date"})`;
}

// ---------- Drafts
export async function listDrafts(): Promise<Draft[]> {
  return safeRead<Draft>(DRAFTS_KEY).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function getDraft(id: string): Promise<Draft | undefined> {
  return safeRead<Draft>(DRAFTS_KEY).find((d) => d.id === id);
}
export async function deleteDraft(id: string): Promise<void> {
  safeWrite(DRAFTS_KEY, safeRead<Draft>(DRAFTS_KEY).filter((d) => d.id !== id));
}
export async function saveDraft(data: RequestFormData, draftId?: string) {
  const now = new Date().toISOString();
  const title = buildTitle(data);
  const list = safeRead<Draft>(DRAFTS_KEY);
  if (draftId) {
    const i = list.findIndex((d) => d.id === draftId);
    if (i >= 0) {
      list[i] = { ...list[i], title, data, updatedAt: now };
      safeWrite(DRAFTS_KEY, list);
      return { id: draftId, savedAt: now };
    }
  }
  const id = crypto.randomUUID();
  list.unshift({ id, title, data, createdAt: now, updatedAt: now });
  safeWrite(DRAFTS_KEY, list);
  return { id, savedAt: now };
}

// ---------- Submissions
export async function listSubmissions(): Promise<Submission[]> {
  return safeRead<Submission>(SUBMITS_KEY).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function getSubmission(id: string): Promise<Submission | undefined> {
  return safeRead<Submission>(SUBMITS_KEY).find((s) => s.id === id);
}
export async function cancelSubmission(id: string) {
  const list = safeRead<Submission>(SUBMITS_KEY);
  const i = list.findIndex((s) => s.id === id);
  if (i >= 0) {
    list[i] = { ...list[i], status: "cancelled", updatedAt: new Date().toISOString() };
    safeWrite(SUBMITS_KEY, list);
  }
}
export async function submitRequest(data: RequestFormData) {
  // create new submission
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
  const list = safeRead<Submission>(SUBMITS_KEY);
  const id = crypto.randomUUID();
  list.unshift({
    id,
    title,
    data,
    status: "pending",
    firstReceiver: first,
    approvalPath: path,
    createdAt: now,
    updatedAt: now,
  });
  safeWrite(SUBMITS_KEY, list);
  return { id, firstReceiver: first, approvalPath: path, submittedAt: now };
}
export async function updateSubmission(id: string, data: RequestFormData) {
  // modify existing submission if still pending
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

  list[i] = {
    ...list[i],
    title,
    data,
    firstReceiver: first,
    approvalPath: path,
    updatedAt: now,
  };
  safeWrite(SUBMITS_KEY, list);
  return { id, updatedAt: now };
}
