import type { DashboardData, RequestRow } from "../types";
import type { ListRequestsQuery } from "../repo";
// import { supabase } from "@/lib/supabaseClient"; // when ready

export async function getDashboardData(): Promise<DashboardData> {
  // TODO: Replace with real queries/aggregations
  return {
    kpis: [],
    requestsByDay: [],
    statusBreakdown: [],
    utilization: [],
    deptUsage: [],
    recentRequests: [],
    recentTrips: [],
    receivedAt: new Date().toISOString(),
  };
}

export async function listRequests(
  _query: ListRequestsQuery
): Promise<{ rows: RequestRow[]; total: number }> {
  // TODO: Translate filters to DB query; return exact shape
  return { rows: [], total: 0 };
}

export async function getRequest(_id: string): Promise<RequestRow> {
  // TODO
  throw new Error("Not implemented");
}

export async function updateRequest(
  _id: string,
  _patch: Partial<RequestRow>
): Promise<RequestRow> {
  // TODO
  throw new Error("Not implemented");
}

export async function bulkUpdate(_ids: string[], _patch: Partial<RequestRow>): Promise<void> {
  // TODO
  throw new Error("Not implemented");
}
