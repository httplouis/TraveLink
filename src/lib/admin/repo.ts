"use server";

import type { DashboardData, RequestRow } from "./types";
import * as mock from "./adapters/mock";
import * as real from "./adapters/real";

// Flip to REAL by setting NEXT_PUBLIC_TRAVILINK_USE_MOCK=false in .env.local
const USE_MOCK = process.env.NEXT_PUBLIC_TRAVILINK_USE_MOCK !== "false";
const dash = USE_MOCK ? mock : real;
const reqs = USE_MOCK ? mock : real;

/* ---------------- Types ---------------- */
export type ListRequestsQuery = {
  status?: string;
  dept?: string;
  search?: string;
  from?: string;   // ISO date (inclusive)
  to?: string;     // ISO date (inclusive)
  page?: number;   // 1-based
  pageSize?: number;
};

/* --------------- Dashboard -------------- */
export async function getDashboardData(): Promise<DashboardData> {
  return dash.getDashboardData();
}

/* ---------------- Requests -------------- */
export async function listRequests(
  query: ListRequestsQuery
): Promise<{ rows: RequestRow[]; total: number }> {
  return reqs.listRequests(query);
}

export async function getRequest(id: string): Promise<RequestRow> {
  return reqs.getRequest(id);
}

export async function updateRequest(
  id: string,
  patch: Partial<RequestRow>
): Promise<RequestRow> {
  return reqs.updateRequest(id, patch);
}

export async function bulkUpdate(
  ids: string[],
  patch: Partial<RequestRow>
): Promise<void> {
  return reqs.bulkUpdate(ids, patch);
}
