"use client";

import * as React from "react";
import {
  CalendarDays,
  Clock,
  User,
  Truck,
  Building2,
  UserCircle2,
} from "lucide-react";
import type { RequestRow, Pagination } from "@/lib/admin/types";

type Props = {
  rows?: RequestRow[];
  pagination: Pagination;
  onPageChange: (page: number) => void;

  /** Selection for bulk actions */
  selectedIds?: Set<string>;
  onToggleOne?: (id: string) => void;

  /** Row UX */
  onRowClick?: (row: RequestRow) => void;
  onApproveRow?: (id: string) => Promise<void>;
  onRejectRow?: (id: string) => Promise<void>;
};

export default function RequestsCardGridUI({
  rows,
  pagination,
  onPageChange,
  selectedIds,
  onToggleOne,
  onRowClick,
  onApproveRow,
  onRejectRow,
}: Props) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const sel = selectedIds instanceof Set ? selectedIds : new Set<string>();

  return (
    <div className="rounded-2xl bg-transparent">
      {/* Responsive auto-fit grid */}
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        {safeRows.map((r) => (
          <Card
            key={r.id}
            row={r}
            selected={sel.has(r.id)}
            onToggle={() => onToggleOne?.(r.id)}
            onOpen={() => onRowClick?.(r)}
            onApprove={onApproveRow ? () => onApproveRow(r.id) : undefined}
            onReject={onRejectRow ? () => onRejectRow(r.id) : undefined}
          />
        ))}

        {safeRows.length === 0 && (
          <div className="col-span-full py-10 text-center text-sm text-neutral-500">
            No requests to show.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          disabled={
            pagination.page >=
            Math.ceil(pagination.total / Math.max(1, pagination.pageSize))
          }
          onClick={() => onPageChange(pagination.page + 1)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          Next
        </button>
        <div className="ml-2 text-xs text-neutral-500">
          Page {pagination.page} of{" "}
          {Math.max(
            1,
            Math.ceil(pagination.total / Math.max(1, pagination.pageSize))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function Card({
  row,
  selected,
  onToggle,
  onOpen,
  onApprove,
  onReject,
}: {
  row: RequestRow;
  selected?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const received =
    (row as any).receivedAt ??
    (row as any).createdAt ??
    (row as any).submittedAt ??
    "—";

  const canAct = row.status === "Pending";

  return (
    <div
      className={[
        "group relative rounded-xl bg-white shadow-md transition-all hover:shadow-lg",
        // BLUE OUTLINE WHEN SELECTED
        selected ? "ring-2 ring-blue-500 ring-offset-2" : "ring-0",
      ].join(" ")}
    >
      {/* Full-card click opens details (kept behind controls via z-index) */}
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`Open ${row.id} details`}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Selection checkbox triggers bulk actions */}
          <input
            type="checkbox"
            aria-label={`Select ${row.id}`}
            checked={!!selected}
            onChange={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer accent-blue-600"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            className="text-[14px] font-semibold text-[#7a1f2a] hover:underline"
            title="Open details"
          >
            {row.id}
          </button>
        </div>
        <StatusBadge status={row.status} />
      </div>

      {/* Body */}
      <div className="relative z-10 space-y-3 px-4 py-3 text-[13px] text-neutral-800">
        <div className="font-medium text-neutral-700">{row.purpose}</div>

        <Field
          icon={<Clock className="h-4 w-4 text-[#7a1f2a]" />}
          label="Received"
          value={received}
        />
        <Field
          icon={<CalendarDays className="h-4 w-4 text-[#7a1f2a]" />}
          label="Date"
          value={row.date}
        />
        <Field
          icon={<Building2 className="h-4 w-4 text-[#7a1f2a]" />}
          label="Department"
          value={row.dept}
        />
        <Field
          icon={<User className="h-4 w-4 text-[#7a1f2a]" />}
          label="Driver"
          value={row.driver ?? "—"}
        />
        <Field
          icon={<UserCircle2 className="h-4 w-4 text-[#7a1f2a]" />}
          label="Requester"
          value={row.requester ?? "—"}
        />
        <Field
          icon={<Truck className="h-4 w-4 text-[#7a1f2a]" />}
          label="Vehicle"
          value={row.vehicle ?? "—"}
        />
      </div>

      {/* Footer (actions won’t open details) */}
      <div className="relative z-10 flex items-center justify-end gap-2 border-t border-neutral-100 px-4 py-3">
        {canAct ? (
          <>
            <button
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-rose-700"
              onClick={(e) => {
                e.stopPropagation();
                onReject?.();
              }}
            >
              Reject
            </button>
            <button
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.();
              }}
            >
              Approve
            </button>
          </>
        ) : (
          <span className="text-xs text-neutral-400">No actions available</span>
        )}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="text-[11px] uppercase text-neutral-500">{label}</div>
        <div className="text-[13px] text-neutral-800">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RequestRow["status"] }) {
  const c: Record<RequestRow["status"], string> = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Completed: "bg-blue-100 text-blue-800",
    Rejected: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c[status]}`}>
      {status}
    </span>
  );
}
