// src/components/admin/requests/ui/RequestsReceiverView.ui.tsx
"use client";

import * as React from "react";
import type { RequestRow, Pagination as Pg } from "@/lib/admin/types";
import { ChevronLeft, ChevronRight, CheckSquare, CheckCircle2 } from "lucide-react";

/* Status accent & badge (consistent colors) */
function statusAccent(status: RequestRow["status"]) {
  switch (status) {
    case "Approved":
      return { bar: "bg-emerald-500", badge: "border-emerald-300 bg-emerald-50 text-emerald-800" };
    case "Completed":
      return { bar: "bg-sky-500", badge: "border-sky-300 bg-sky-50 text-sky-800" };
    case "Rejected":
      return { bar: "bg-rose-500", badge: "border-rose-300 bg-rose-50 text-rose-800" };
    default: // Pending
      return { bar: "bg-amber-500", badge: "border-amber-300 bg-amber-50 text-amber-800" };
  }
}

type Props = {
  rows: RequestRow[];
  pagination: Pg;
  onPageChange: (page: number) => void;
  onRowClick: (row: RequestRow) => void;

  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAllOnPage: (checked: boolean, idsOnPage: string[]) => void;

  unreadIds?: Set<string>;
  onMarkRead?: (id: string) => void;
};

export default function RequestsReceiverViewUI({
  rows,
  pagination,
  onPageChange,
  onRowClick,
  selectedIds,
  onToggleOne,
  onToggleAllOnPage,
  unreadIds = new Set(),
  onMarkRead,
}: Props) {
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const idsOnPage = React.useMemo(() => rows.map((r) => r.id), [rows]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300"
            checked={allOnPageSelected}
            onChange={(e) => onToggleAllOnPage(e.target.checked, idsOnPage)}
            suppressHydrationWarning
          />
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="h-4 w-4 opacity-70" />
            Select all on page
          </span>
        </label>

        <div className="flex items-center gap-2 text-sm">
          <button
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1"
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="min-w-[120px] text-center">
            Page {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
          </span>
          <button
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1"
            onClick={() =>
              onPageChange(
                Math.min(
                  Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
                  pagination.page + 1
                )
              )
            }
            disabled={pagination.page >= Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* cards */}
      <ul className="space-y-3">
        {rows.map((r) => {
          const isUnread = unreadIds.has(r.id);
          const { bar, badge } = statusAccent(r.status);

          const cardBase =
            "group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-colors hover:shadow-md";
          const cardVariant = isUnread
            ? "bg-neutral-50 border-neutral-300"
            : "bg-white border-neutral-200";

          return (
            <li key={r.id} className={[cardBase, cardVariant].join(" ")}>
              {/* left status accent */}
              <div className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 ${bar}`} />

              {/* controls */}
              <div className="absolute right-4 top-3 flex items-center gap-2">
                {isUnread && onMarkRead && (
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 opacity-0 transition-opacity hover:bg-neutral-50 group-hover:opacity-100"
                    title="Mark as read"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(r.id);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark read
                  </button>
                )}
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300"
                  checked={selectedIds.has(r.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleOne(r.id);
                  }}
                  suppressHydrationWarning
                />
              </div>

              {/* content: consistent typography (no mixed bolds) */}
              <button className="w-full text-left" onClick={() => onRowClick(r)} aria-label="Open details">
                {/* department */}
                <div className="text-xs font-normal uppercase tracking-wide text-neutral-500">
                  {r.dept || "—"}
                </div>

                {/* title */}
                <div
                  className={[
                    "mt-1 text-[15px] leading-snug text-neutral-900",
                    isUnread ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  {r.purpose || "—"}
                </div>

                {/* meta rows */}
                <div className="mt-2 text-sm font-normal text-neutral-700">
                  <span className="text-neutral-500">Requested by:</span> {r.requester || "—"}
                </div>

                <div className="mt-1 text-sm font-normal text-neutral-700">
                  <span className="text-neutral-500">Driver:</span> {r.driver || "—"}{" "}
                  <span className="mx-2">•</span>
                  <span className="text-neutral-500">Vehicle:</span> {r.vehicle || "—"}{" "}
                  <span className="mx-2">•</span>
                  <span className="text-neutral-500">Date:</span> {r.date}
                </div>

                {/* status badge */}
                <div className="mt-2">
                  <span className={["inline-flex rounded-full border px-2.5 py-0.5 text-xs", badge].join(" ")}>
                    {r.status}
                  </span>
                </div>
              </button>
            </li>
          );
        })}

        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-10 text-center text-sm text-neutral-500">
            No results.
          </li>
        )}
      </ul>
    </div>
  );
}
