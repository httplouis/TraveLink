"use client";
import { useEffect, useMemo, useState } from "react";
import type { FilterState, RequestRow } from "@/lib/admin/types";

export const DEFAULT_FILTERS: FilterState = {
  status: "All",
  dept: "All",
  from: "",
  to: "",
  search: "",
  mode: "auto",
};

export function useFilterState(initial: FilterState = DEFAULT_FILTERS) {
  const [applied, setApplied] = useState<FilterState>(initial);
  const [draft, setDraft] = useState<FilterState>(initial);

  function apply() { setApplied(draft); }
  function clearAll() { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }
  function update(next: Partial<FilterState>) {
    const n = { ...draft, ...next };
    setDraft(n);
    if (n.mode === "auto") setApplied(n);
  }
  return { draft, applied, update, apply, clearAll, setDraft };
}

export function filterRows(rows: RequestRow[], f: FilterState) {
  const q = (f.search ?? "").toLowerCase().trim();
  return rows.filter(r => {
    const okStatus = f.status === "All" || r.status === f.status;
    const okDept = f.dept === "All" || r.dept === f.dept;
    const okSearch = !q || r.id.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q);
    const okFrom = !f.from || r.date >= f.from!;
    const okTo = !f.to || r.date <= f.to!;
    return okStatus && okDept && okSearch && okFrom && okTo;
  });
}

export const useFilteredRows = (rows: RequestRow[], f: FilterState) =>
  useMemo(() => filterRows(rows, f), [rows, f]);

export const isFiltered = (f: FilterState) =>
  f.status !== "All" || f.dept !== "All" || !!f.from || !!f.to;
