// src/components/admin/maintenance/filters/FiltersBar.ui.tsx
"use client";
import * as React from "react";
import { Search } from "lucide-react";
import type { MaintFilters } from "@/lib/admin/maintenance/types";
import { MaintConstants } from "@/lib/admin/maintenance/service";
import { Select } from "@/components/common/inputs/Select.ui"; // string[] options

const TYPE_OPTIONS = ["All Types", ...MaintConstants.types] as const;
const STATUS_OPTIONS = ["All Status", ...MaintConstants.statuses] as const;

export function MaintFiltersBar({
  value, onChange, onClear
}: {
  value: MaintFilters;
  onChange: (v: MaintFilters) => void;
  onClear: () => void;
}) {
  const typeDisplay = value.type ?? "All Types";
  const statusDisplay = value.status ?? "All Status";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border">
        <Search size={16} className="opacity-60" />
        <input
          value={value.search ?? ""}
          onChange={(e) => onChange({ ...value, search: e.currentTarget.value })}
          placeholder="Search vehicle, plate, description…"
          autoComplete="off"
          className="outline-none text-sm"
          suppressHydrationWarning
          aria-label="Search maintenance"
        />
      </div>

      <Select
        label="Type"
        value={typeDisplay}
        options={TYPE_OPTIONS}
        onChange={(next) =>
          onChange({ ...value, type: next === "All Types" ? undefined : (next as any) })
        }
      />

      <Select
        label="Status"
        value={statusDisplay}
        options={STATUS_OPTIONS}
        onChange={(next) =>
          onChange({ ...value, status: next === "All Status" ? undefined : (next as any) })
        }
      />

      <button
        onClick={onClear}
        className="ml-auto px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
        aria-label="Clear filters"
      >
        Clear
      </button>
    </div>
  );
}
