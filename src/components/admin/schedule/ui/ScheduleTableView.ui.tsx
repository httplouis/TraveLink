// src/components/admin/schedule/ui/ScheduleTableView.ui.tsx
"use client";
import * as React from "react";
import {
  Play,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Pencil,
  Eye,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

/** Row data passed from the container */
export type RowView = {
  id: string;
  title: string;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  tripId: string;
  date: string;
  startTime: string;
  endTime: string;
  origin: string;
  destination: string;
  driverName: string;
  vehicleName: string;
  can: { start: boolean; complete: boolean; cancel: boolean; reopen: boolean };
  onView: () => void;
  onEdit: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReopen: () => void;
};

export type PaginationView = {
  page: number;
  pageSize: number;
  total: number;
};

export function ScheduleTableView({
  rows,
  pagination,
  selected,
  onToggleOne,
  onToggleAll,
  onDeleteMany,
  onPageChange,
  toolbar,
}: {
  rows: RowView[];
  pagination: PaginationView;
  selected: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onDeleteMany: () => void;
  onPageChange: (p: number) => void;
  toolbar: React.ReactNode;
}) {
  const allOnPage = rows.map((r) => r.id);
  const allChecked = allOnPage.length > 0 && allOnPage.every((id) => selected.has(id));
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
      {/* Sticky header (toolbar + count) */}
      <div className="sticky top-[var(--table-sticky-top,0px)] z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-t-2xl">
        <div className="px-3 py-2">{toolbar}</div>
        <div className="h-px w-full bg-neutral-200" />
        <div className="flex items-center justify-between px-3 py-2">
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300"
              checked={allChecked}
              onChange={(e) => onToggleAll(e.target.checked)}
            />
            <span className="opacity-70">{pagination.total} total</span>
          </label>

          {selected.size > 0 && (
            <button
              onClick={onDeleteMany}
              className="h-9 rounded-full bg-neutral-100 px-4 text-sm hover:bg-neutral-200 transition-colors"
            >
              Delete selected ({selected.size})
            </button>
          )}
        </div>
        <div className="h-px w-full bg-neutral-200" />
      </div>

      {/* Rows */}
      <div className="divide-y">
        {rows.map((r) => (
          <ScheduleRow
            key={r.id}
            row={r}
            checked={selected.has(r.id)}
            onCheck={onToggleOne}
          />
        ))}

        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-neutral-500">
            No schedules match your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t">
        <div className="text-sm text-neutral-600">
          Page {pagination.page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full px-3 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
          >
            Prev
          </button>
          <button
            className="rounded-full px-3 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50"
            onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
            disabled={pagination.page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Row ---------- */

function statusAccent(status: RowView["status"]) {
  return {
    PLANNED: "border-amber-400/70",
    ONGOING: "border-blue-500/70",
    COMPLETED: "border-emerald-500/70",
    CANCELLED: "border-rose-500/70",
  }[status];
}

function ScheduleRow({
  row: r,
  checked,
  onCheck,
}: {
  row: RowView;
  checked: boolean;
  onCheck: (id: string, checked: boolean) => void;
}) {
  return (
    <div
      className={`group grid grid-cols-[40px_1fr_auto] gap-3 px-3 sm:px-4 py-3 hover:bg-neutral-50 border-l-4 ${statusAccent(
        r.status
      )}`}
    >
      {/* checkbox */}
      <div className="flex items-start pt-1.5">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300"
          checked={checked}
          onChange={(e) => onCheck(r.id, e.target.checked)}
        />
      </div>

      {/* main info */}
      <button onClick={r.onView} className="text-left min-w-0" title="View details">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900 truncate">{r.title}</span>
          <StatusBadge status={r.status} />
        </div>
        <div className="mt-1 text-[13px] text-neutral-600 flex flex-wrap gap-x-4 gap-y-1">
          <span className="truncate">
            <span className="font-medium">Trip ID:</span> {r.tripId}
          </span>
          <span className="truncate">
            <span className="font-medium">When:</span> {r.date} {r.startTime}–{r.endTime}
          </span>
          <span className="truncate">
            <span className="font-medium">Driver:</span> {r.driverName}
          </span>
          <span className="truncate">
            <span className="font-medium">Vehicle:</span> {r.vehicleName}
          </span>
        </div>
        <div className="mt-1 text-[13px] text-neutral-600 truncate">
          <span className="font-medium">Route:</span> {r.origin} → {r.destination}
        </div>
      </button>

      {/* colorful, borderless icon actions */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <IconPill title="View" onClick={r.onView} variant="neutral">
          <Eye size={16} />
        </IconPill>

        <IconPill title="Edit" onClick={r.onEdit} variant="brand">
          <Pencil size={16} />
        </IconPill>

        <IconPill
          title="Start"
          onClick={r.onStart}
          variant="blue"
          disabled={!r.can.start}
        >
          <Play size={16} />
        </IconPill>

        <IconPill
          title="Complete"
          onClick={r.onComplete}
          variant="green"
          disabled={!r.can.complete}
        >
          <CheckCircle2 size={16} />
        </IconPill>

        <IconPill
          title="Cancel"
          onClick={r.onCancel}
          variant="rose"
          disabled={!r.can.cancel}
        >
          <XCircle size={16} />
        </IconPill>

        <IconPill
          title="Reopen"
          onClick={r.onReopen}
          variant="amber"
          disabled={!r.can.reopen}
        >
          <RotateCcw size={16} />
        </IconPill>
      </div>
    </div>
  );
}

/* ---------- Shared UI ---------- */

function IconPill({
  title,
  onClick,
  children,
  disabled,
  variant = "neutral",
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "neutral" | "brand" | "blue" | "green" | "rose" | "amber";
}) {
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const styles: Record<string, string> = {
    neutral: "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 focus-visible:ring-neutral-300",
    brand:
      "bg-[#7a1f2a]/10 hover:bg-[#7a1f2a]/15 text-[#7a1f2a] focus-visible:ring-[#7a1f2a]/30",
    blue: "bg-blue-100 hover:bg-blue-200 text-blue-700 focus-visible:ring-blue-300",
    green: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 focus-visible:ring-emerald-300",
    rose: "bg-rose-100 hover:bg-rose-200 text-rose-700 focus-visible:ring-rose-300",
    amber: "bg-amber-100 hover:bg-amber-200 text-amber-700 focus-visible:ring-amber-300",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} disabled:opacity-40`}
    >
      {/* keep only icon; text hidden for compactness */}
      <span className="grid place-items-center">
        {children}
      </span>
    </button>
  );
}
