"use client";
import * as React from "react";
import { SortAsc, SortDesc, Plus, Filter } from "lucide-react";
import type { ScheduleFilterState } from "@/lib/admin/schedule/filters";
import ScheduleFilterDropdownUI from "../filters/ScheduleFilterDropdown.ui";

type Sort = "newest" | "oldest";

export default function ScheduleToolbar({
  q, onQChange,
  sort, onSortChange,
  onAddNew,
  draft, onDraftChange, onApply, onClearAll,
}: {
  q: string; onQChange: (v: string)=>void;
  sort: Sort; onSortChange: (s: Sort)=>void;
  onAddNew: () => void;
  draft: ScheduleFilterState;
  onDraftChange: (n: Partial<ScheduleFilterState>) => void;
  onApply: () => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search schedules (Trip ID, title, origin, destination)…"
            className="h-9 w-[320px] rounded-md border border-neutral-300 bg-white pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#7a1f2a]/40"
          />
          <Filter size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
        </div>

        <ScheduleFilterDropdownUI
          draft={draft}
          onDraftChange={onDraftChange}
          onApply={onApply}
          onClearAll={onClearAll}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSortChange(sort === "newest" ? "oldest" : "newest")}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          {sort === "newest" ? <SortDesc size={16} /> : <SortAsc size={16} />}
          {sort === "newest" ? "Newest first" : "Oldest first"}
        </button>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-2 rounded-md bg-[#7a1f2a] px-3 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          <Plus size={16} />
          Add schedule
        </button>
      </div>
    </div>
  );
}
