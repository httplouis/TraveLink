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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 p-4 bg-white shadow-md">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-[#7a1f2a]/30 focus-within:border-[#7a1f2a] transition-all">
        <Search size={16} className="text-neutral-400" />
        <input
          className="outline-none text-sm flex-1 min-w-[200px]"
          placeholder="Search id, purpose, vehicle, driver, department…"
          value={value.search ?? ""}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>

      <select
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white max-w-[360px] hover:border-[#7a1f2a] focus:outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 transition-colors"
        value={value.department ?? ""}
        onChange={(e) => onChange({ ...value, department: e.target.value as any })}
      >
        <option value="">All Departments</option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white hover:border-[#7a1f2a] focus:outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 transition-colors"
        value={value.requestType ?? "all"}
        onChange={(e) => onChange({ ...value, requestType: e.target.value as any })}
      >
        <option value="all">All Types</option>
        <option value="travel_order">Travel Orders</option>
        <option value="seminar">Seminar Applications</option>
      </select>

      <select
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white hover:border-[#7a1f2a] focus:outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 transition-colors"
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: e.target.value as any })}
      >
        <option value="">All Status</option>
        <option>Pending</option><option>Approved</option>
        <option>Completed</option><option>Rejected</option>
      </select>

      <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2 py-1">
        <input
          type="date"
          className="outline-none text-sm bg-transparent"
          value={value.from ?? ""}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
        <span className="text-sm text-neutral-500">to</span>
        <input
          type="date"
          className="outline-none text-sm bg-transparent"
          value={value.to ?? ""}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </div>

      <button
        className="ml-auto rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 hover:border-[#7a1f2a] transition-colors font-medium"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
