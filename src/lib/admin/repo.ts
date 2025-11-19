"use server";

import type { DashboardData, RequestRow } from "./types";
import * as real from "./adapters/real";

// Always use real adapter - no mock data
const dash = real;
const reqs = real;

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
