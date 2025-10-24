// src/components/admin/requests/toolbar/RequestsToolbar.ui.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { FilterState } from "@/lib/admin/types";
import {
  Search,
  Filter,
  ChevronDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import { DEPARTMENTS as RAW_DEPARTMENTS } from "@/lib/org/departments";

/** Admin Travel Order sheet (UI container) */
import AdminRequestFormSheet from "@/components/admin/requests/containers/AdminRequestFormSheet.container";

type Props = {
  tableSearch: string;
  onTableSearch: (v: string) => void;

  sortDir: "asc" | "desc";
  onSortDirChange: (v: "asc" | "desc") => void;

  /** Optional — any side-effect like toast; sheet opens regardless. */
  onAddNew?: () => void;

  draft: FilterState;
  onDraftChange: (patch: Partial<FilterState>) => void;
  onApply: () => void;
  onClearAll: () => void;

  selectedCount?: number;
  onDeleteSelected?: () => void;

  onMarkSelectedRead?: () => void;
};

function normalizeDepartments(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((d) => {
        if (typeof d === "string") return d.trim();
        const anyD = d as any;
        return String(anyD.name ?? anyD.label ?? anyD.title ?? anyD.code ?? anyD.id ?? "").trim();
      })
      .filter(Boolean);
  }
  return [];
}
const DEPARTMENT_OPTIONS: string[] = (() => {
  const list = normalizeDepartments(RAW_DEPARTMENTS);
  const seen = new Set<string>();
  const unique = list.filter((x) => (seen.has(x) ? false : (seen.add(x), true)));
  return ["All", ...unique];
})();

export default function RequestsToolbarUI({
  tableSearch,
  onTableSearch,
  sortDir,
  onSortDirChange,
  onAddNew,
  draft,
  onDraftChange,
  onApply,
  onClearAll,
  selectedCount = 0,
  onDeleteSelected,
  onMarkSelectedRead,
}: Props) {
  const [filterOpen, setFilterOpen] = React.useState(false);

  /** Local sheet state */
  const [formOpen, setFormOpen] = React.useState(false);

  /** Always open the sheet; also call parent's callback if provided */
  const handleAddNew = () => {
    setFormOpen(true);
    onAddNew?.();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <input
            value={tableSearch}
            onChange={(e) => onTableSearch(e.target.value)}
            placeholder="Search requests…"
            className="h-10 w-64 rounded-xl border border-neutral-300 pl-9 pr-3 text-sm outline-none focus:border-neutral-500"
            autoComplete="off"
            suppressHydrationWarning
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </button>

          {filterOpen && (
            <div className="absolute z-20 mt-2 w-80 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
              {/* Status */}
              <label className="mb-2 block text-xs font-medium text-neutral-700">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                  value={draft.status}
                  onChange={(e) => onDraftChange({ status: e.target.value as any })}
                >
                  <option>All</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Completed</option>
                  <option>Rejected</option>
                </select>
              </label>

              {/* Department — from lib */}
              <label className="mb-2 block text-xs font-medium text-neutral-700">
                Department
                <select
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                  value={(draft.dept as any) ?? "All"}
                  onChange={(e) => onDraftChange({ dept: e.target.value as any })}
                >
                  {DEPARTMENT_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Date range */}
              <div className="mb-2 grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-neutral-700">
                  From
                  <div className="relative mt-1">
                    <CalendarIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                    <input
                      type="date"
                      value={draft.from || ""}
                      onChange={(e) => onDraftChange({ from: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 pl-8 pr-2 py-2 text-sm"
                      autoComplete="off"
                      suppressHydrationWarning
                    />
                  </div>
                </label>
                <label className="block text-xs font-medium text-neutral-700">
                  To
                  <div className="relative mt-1">
                    <CalendarIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                    <input
                      type="date"
                      value={draft.to || ""}
                      onChange={(e) => onDraftChange({ to: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 pl-8 pr-2 py-2 text-sm"
                      autoComplete="off"
                      suppressHydrationWarning
                    />
                  </div>
                </label>
              </div>

              {/* Mode */}
              <label className="mb-3 block text-xs font-medium text-neutral-700">
                Mode
                <select
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                  value={draft.mode}
                  onChange={(e) => onDraftChange({ mode: e.target.value as any })}
                >
                  <option value="auto">Auto (instant)</option>
                  <option value="apply">Apply button</option>
                </select>
              </label>

              <div className="mt-3 flex items-center justify-between">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  onClick={onClearAll}
                >
                  Clear All
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7a1f2a] px-4 py-2 text-sm text-white"
                  onClick={onApply}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
          onClick={() => onSortDirChange(sortDir === "desc" ? "asc" : "desc")}
          title="Toggle sort"
        >
          {sortDir === "desc" ? (
            <>
              <ArrowDownWideNarrow className="h-4 w-4" />
              <span>Newest first</span>
            </>
          ) : (
            <>
              <ArrowUpNarrowWide className="h-4 w-4" />
              <span>Oldest first</span>
            </>
          )}
        </button>

        <div className="flex-1" />

        {/* Quick link to Trash */}
        <Link
          href="/admin/requests/trash"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
          title="Open Trash"
        >
          <Trash2 className="h-4 w-4" />
          <span>Trash</span>
        </Link>

        {/* Mark as read (bulk) */}
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm text-emerald-800 disabled:opacity-50"
          disabled={!selectedCount}
          onClick={() => onMarkSelectedRead && onMarkSelectedRead()}
          title="Mark selected as read"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Mark as read {selectedCount ? `(${selectedCount})` : ""}</span>
        </button>

        {/* Delete selected */}
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 text-sm text-rose-800 disabled:opacity-50"
          disabled={!selectedCount}
          onClick={() => onDeleteSelected && onDeleteSelected()}
          title="Move selected to Trash (kept 30 days)"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete selected {selectedCount ? `(${selectedCount})` : ""}</span>
        </button>

        {/* Add new */}
        <button
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#7a1f2a] px-3 text-sm text-white"
          onClick={handleAddNew}
        >
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </button>
      </div>

      {/* Admin Travel Order form sheet */}
      <AdminRequestFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
