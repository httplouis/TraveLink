"use server";

import { MOCK_TRIPS } from "./mock";
import type { Paged, ReportFilters, TripRow } from "./types";

const within = (d: string, from?: string, to?: string) => {
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

export async function queryReport(
  filters: ReportFilters,
  page = 1,
  pageSize = 10
): Promise<Paged<TripRow>> {
  const q = (filters.search ?? "").toLowerCase().trim();

  const filtered = MOCK_TRIPS.filter((r) => {
    const matchQ =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      r.vehicleCode.toLowerCase().includes(q) ||
      r.driver.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q);
    const matchDept = !filters.department || r.department === filters.department;
    const matchStatus = !filters.status || r.status === filters.status;
    const matchDate = within(r.date, filters.from, filters.to);
    return matchQ && matchDept && matchStatus && matchDate;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return { rows, total, page, pageSize };
}
