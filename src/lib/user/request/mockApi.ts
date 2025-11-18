// src/lib/user/request/mockApi.ts
import type { RequestFormData } from "@/lib/user/request/types";
import { REASON_OPTIONS } from "@/lib/user/request/types";
import { firstReceiver, fullApprovalPath } from "@/lib/user/request/routing";
// AdminRequestsRepo import removed - no longer needed (using API now)

/* ---------- LocalStorage helpers ---------- */

const DRAFTS_KEY = "travilink_user_request_drafts";
// SUBMITS_KEY removed - submissions now stored in database, not localStorage

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
  // NOW USES REAL API instead of localStorage!
  try {
    const response = await fetch("/api/requests/my-submissions");
    const result = await response.json();

    if (!result.ok) {
      console.error("Failed to fetch submissions:", result.error);
      return [];
    }

    // Transform database format to match Submission type
    const submissions: Submission[] = (result.data || []).map((req: any) => {
      const first = firstReceiver({
        requesterRole: req.requester_is_head ? "head" : "faculty",
        vehicleMode: req.needs_rental ? "rent" : req.needs_vehicle ? "institutional" : "owned",
        reason: req.request_type === "seminar" ? "seminar" : "official",
      });
      
      const path = fullApprovalPath({
        requesterRole: req.requester_is_head ? "head" : "faculty",
        vehicleMode: req.needs_rental ? "rent" : req.needs_vehicle ? "institutional" : "owned",
      });

      return {
        id: req.id,
        title: req.title || `${req.purpose} - ${req.destination}`,
        data: null as any, // Not needed for list view
        status: req.status === "rejected" ? "cancelled" : req.status === "approved" ? "approved" : "pending",
        firstReceiver: first,
        approvalPath: path,
        createdAt: req.created_at,
        updatedAt: req.updated_at || req.created_at,
      };
    });

    return submissions;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
}

export async function getSubmission(id: string): Promise<Submission | undefined> {
  // Fetch from API instead of localStorage
  const submissions = await listSubmissions();
  return submissions.find((s) => s.id === id);
}

/** Create the user-facing submission record.
 * NOW USES REAL API instead of localStorage! */
export async function createSubmission(data: RequestFormData, forcedId?: string) {
  // Call real API to submit to database
  const response = await fetch("/api/requests/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      travelOrder: data.travelOrder,
      reason: data.reason,
      vehicleMode: data.vehicleMode,
      requesterRole: data.requesterRole,
      schoolService: data.schoolService,
      seminar: data.seminar,
    }),
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.error || "Failed to submit request");
  }

  // Return format matching the old interface
  return { 
    id: result.data.id, 
    submittedAt: result.data.created_at 
  };
}

export async function updateSubmission(id: string, data: RequestFormData) {
  // Use API to update request instead of localStorage
  try {
    const response = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Map form data to request fields
        purpose: data.travelOrder?.purposeOfTravel,
        destination: data.travelOrder?.destination,
        travel_start_date: data.travelOrder?.departureDate,
        travel_end_date: data.travelOrder?.returnDate,
        requester_name: data.travelOrder?.requestingPerson,
        // Add other fields as needed
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || "Failed to update request");
    }

    return { id, updatedAt: result.data?.updated_at || new Date().toISOString() };
  } catch (error: any) {
    console.error("[updateSubmission] Error:", error);
    throw new Error(error.message || "Failed to update submission");
  }
}

/** Cancel a pending submission:
 * - Updates request status to 'cancelled' in database via PATCH */
export async function cancelSubmission(id: string) {
  // Use API to cancel request instead of localStorage
  try {
    // Use PATCH to update status to cancelled
    const response = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "cancelled",
        // Add cancellation metadata if needed
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || "Failed to cancel request");
    }

    return { id, cancelledAt: result.data?.updated_at || new Date().toISOString() };
  } catch (error: any) {
    console.error("[cancelSubmission] Error:", error);
    throw new Error(error.message || "Failed to cancel submission");
  }
}
