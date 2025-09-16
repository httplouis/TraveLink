"use client";
import * as React from "react";
import { Search } from "lucide-react";
import type { MaintFilters } from "@/lib/admin/maintenance/types";
import { MaintConstants } from "@/lib/admin/maintenance/service";

export function MaintFiltersBar({
  value, onChange, onClear
}: {
  value: MaintFilters;
  onChange: (v: MaintFilters) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border">
        <Search size={16} className="opacity-60" />
        <input
          placeholder="Search vehicle, plate, description…"
          className="outline-none text-sm"
          value={value.search ?? ""}
          onChange={e => onChange({ ...value, search: e.target.value })}
        />
      </div>

      <select
        className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.type ?? ""}
        onChange={e => onChange({ ...value, type: e.target.value as any })}
      >
        <option value="">All Types</option>
        {MaintConstants.types.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.status ?? ""}
        onChange={e => onChange({ ...value, status: e.target.value as any })}
      >
        <option value="">All Status</option>
        {MaintConstants.statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <button
        onClick={onClear}
        className="ml-auto px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
      >
        Clear
      </button>
    </div>
  );
}
