// src/components/admin/report/ui/ReportFilterBar.ui.tsx
"use client";
import * as React from "react";
import type { ReportFilters } from "@/lib/admin/report/types";
import { DEPARTMENTS } from "@/lib/admin/report/types";
import { Search } from "lucide-react";

export function ReportFilterBar({
  value,
  onChange,
  onClear,
}: {
  value: ReportFilters;
  onChange: (v: ReportFilters) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 bg-white">
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border">
        <Search size={16} className="opacity-60" />
        <input
          className="outline-none text-sm"
          placeholder="Search id, purpose, vehicle, driver, department…"
          value={value.search ?? ""}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>

      <select
        className="rounded-md border px-3 py-2 text-sm bg-white max-w-[360px]"
        value={value.department ?? ""}
        onChange={(e) => onChange({ ...value, department: e.target.value as any })}
      >
        <option value="">All Departments</option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        className="rounded-md border px-3 py-2 text-sm bg-white"
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: e.target.value as any })}
      >
        <option value="">All Status</option>
        <option>Pending</option><option>Approved</option>
        <option>Completed</option><option>Rejected</option>
      </select>

      <input
        type="date"
        className="rounded-md border px-3 py-2 text-sm bg-white"
        value={value.from ?? ""}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
      <span className="text-sm opacity-70">to</span>
      <input
        type="date"
        className="rounded-md border px-3 py-2 text-sm bg-white"
        value={value.to ?? ""}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />

      <button
        className="ml-auto rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
