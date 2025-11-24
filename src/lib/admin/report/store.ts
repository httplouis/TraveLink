"use client";

import type { Paged, ReportFilters, TripRow } from "./types";

export async function queryReport(
  filters: ReportFilters,
  page = 1,
  pageSize = 10
): Promise<Paged<TripRow>> {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.department) params.set("department", filters.department);
    if (filters.status) params.set("status", filters.status);
    if (filters.requestType && filters.requestType !== "all") params.set("requestType", filters.requestType);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    
    const response = await fetch(`/api/admin/reports?${params.toString()}`);
    const result = await response.json();
    
    if (result.ok) {
      return {
        rows: result.rows || [],
        total: result.total || 0,
        page: result.page || page,
        pageSize: result.pageSize || pageSize,
      };
    }
    
    throw new Error(result.error || "Failed to fetch reports");
  } catch (error) {
    console.error("[queryReport] Error:", error);
    return { rows: [], total: 0, page, pageSize };
  }
}
