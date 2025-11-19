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
      return { bar: "bg-orange-500", badge: "border-orange-400 bg-orange-100 text-orange-800" };
  }
}

/* Format timestamp to user-friendly date & time */
function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeFormatted = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateFormatted} • ${timeFormatted}`;
  } catch {
    return dateStr;
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
  // Debug logging
  React.useEffect(() => {
    console.log("[RequestsReceiverViewUI] Received rows:", {
      rowsCount: rows.length,
      rows: rows.map(r => ({
        id: r.id,
        dept: r.dept,
        purpose: r.purpose,
        requester: r.requester,
        status: r.status
      })),
      pagination
    });
  }, [rows, pagination]);
  
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

      {/* cards - Enhanced with better UX */}
      <ul className="space-y-4">
        {rows.map((r) => {
          const isUnread = unreadIds.has(r.id);
          const { bar, badge } = statusAccent(r.status);
          
          // Get initials for avatar
          const initials = (r.requester || "?")
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const cardBase =
            "group relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer";
          const cardVariant = isUnread
            ? "bg-gradient-to-br from-amber-50/30 to-white border-amber-200"
            : "bg-white border-neutral-200";

          return (
            <li key={r.id} className={[cardBase, cardVariant].join(" ")} onClick={() => onRowClick(r)}>
              {/* left status accent - thicker */}
              <div className={`pointer-events-none absolute inset-y-0 left-0 w-2 ${bar}`} />

              {/* Header Section */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5c000c] flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                    {initials}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Department badge */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {r.dept || "—"}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    {/* Purpose/Title */}
                    <h3 className={[
                      "text-base leading-tight text-neutral-900 mb-2",
                      isUnread ? "font-bold" : "font-semibold",
                    ].join(" ")}>
                      {r.purpose || "—"}
                    </h3>
                    
                    {/* Requester info */}
                    <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                      <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{r.requester || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2">
                  {isUnread && onMarkRead && (
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 opacity-0 transition-all hover:bg-neutral-50 hover:border-neutral-400 group-hover:opacity-100"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(r.id);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark read
                    </button>
                  )}
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-[#7A0010] focus:ring-[#7A0010]"
                    checked={selectedIds.has(r.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleOne(r.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-neutral-50/50 rounded-lg mb-3">
                <div>
                  <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Submitted
                  </div>
                  <div className="text-sm font-medium text-neutral-900">{formatDateTime(r.date)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Driver
                  </div>
                  <div className="text-sm font-medium text-neutral-900">{r.driver === "—" ? <span className="text-neutral-400">Not assigned</span> : r.driver}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-0.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Vehicle
                  </div>
                  <div className="text-sm font-medium text-neutral-900">{r.vehicle === "—" ? <span className="text-neutral-400">Not assigned</span> : r.vehicle}</div>
                </div>
              </div>

              {/* Footer with status and actions */}
              <div className="flex items-center justify-between">
                <span className={["inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold", badge].join(" ")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  {r.status}
                </span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(r);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#7A0010] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#5c000c] hover:shadow-md opacity-0 group-hover:opacity-100"
                >
                  View & Approve
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
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
