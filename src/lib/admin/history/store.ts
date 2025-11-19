// src/lib/admin/history/store.ts
"use client";

import type { HistoryItem, HistoryFilters, HistoryStats } from "./types";

export async function queryHistory(
  filters: HistoryFilters,
  page = 1,
  pageSize = 20
): Promise<{ data: HistoryItem[]; total: number; page: number; pageSize: number }> {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);
    if (filters.department) params.set("department", filters.department);
    if (filters.status) params.set("status", filters.status);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const response = await fetch(`/api/admin/history?${params.toString()}`);
    const result = await response.json();

    if (result.ok) {
      return {
        data: result.data || [],
        total: result.total || 0,
        page: result.page || page,
        pageSize: result.pageSize || pageSize,
      };
    }

    throw new Error(result.error || "Failed to fetch history");
  } catch (error) {
    console.error("[queryHistory] Error:", error);
    return { data: [], total: 0, page, pageSize };
  }
}

export async function getHistoryStats(): Promise<HistoryStats> {
  try {
    const response = await fetch("/api/admin/history/stats");
    const result = await response.json();

    if (result.ok) {
      return result.data;
    }

    return {
      totalRequests: 0,
      totalMaintenance: 0,
      totalCost: 0,
      completedThisMonth: 0,
    };
  } catch (error) {
    console.error("[getHistoryStats] Error:", error);
    return {
      totalRequests: 0,
      totalMaintenance: 0,
      totalCost: 0,
      completedThisMonth: 0,
    };
  }
}

