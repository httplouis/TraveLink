"use client";
import * as React from "react";
import { RequestRow } from "@/lib/admin/types";

type Props = {
  open: boolean;
  onClose: () => void;
  row?: RequestRow;
  onApprove?: () => void;
  onReject?: () => void;
};

export default function RequestDetailsModalUI({
  open,
  onClose,
  row,
  onApprove,
  onReject,
}: Props) {
  React.useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !row) return null;
  const canAct = row.status === "Pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="req-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative w-[680px] max-w-[95vw] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-100 text-neutral-700 text-sm font-semibold">
              TL
            </div>
            <div>
              <h2 id="req-modal-title" className="text-base md:text-lg font-semibold text-neutral-900">
                Request {row.id}
              </h2>
              <div className="mt-0.5 text-xs text-neutral-500">Details overview</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={row.status} />
            <button
              aria-label="Close"
              onClick={onClose}
              className="rounded-lg border bg-white px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-auto px-5 py-5 md:px-6 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Field label="Department" value={row.dept} />
            <Field label="Date" value={row.date} />
            <Field label="Requester" value={row.requester ?? "—"} />
            <Field label="Driver" value={row.driver ?? "—"} />
            <Field label="Vehicle" value={row.vehicle ?? "—"} />
            <Field label="Purpose" value={row.purpose} className="md:col-span-2" tall />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t px-5 py-3.5 md:px-6">
          <div className="text-xs text-neutral-500">
            Updated just now • Read-only view
          </div>

          {canAct ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onReject}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.98]"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                className="rounded-lg bg-green-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-green-700 active:scale-[0.98]"
              >
                Approve
              </button>
            </div>
          ) : (
            <span className="text-sm text-neutral-500">No actions available</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- small pieces ---- */

function Field({
  label,
  value,
  className = "",
  tall = false,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  tall?: boolean;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500">
        {label.toUpperCase()}
      </div>
      <div
        className={
          "w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[14px] text-neutral-900 " +
          (tall ? "min-h-[56px]" : "h-10 flex items-center")
        }
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RequestRow["status"] }) {
  const map: Record<RequestRow["status"], string> = {
    Pending: "bg-amber-100 text-amber-800 ring-amber-200",
    Approved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    Completed: "bg-blue-100 text-blue-800 ring-blue-200",
    Rejected: "bg-rose-100 text-rose-800 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${map[status]}`}
    >
      {status}
    </span>
  );
}
