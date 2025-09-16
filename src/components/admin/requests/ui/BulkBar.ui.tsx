"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Trash2, FileDown, HelpCircle } from "lucide-react";

type BusyKind = "approve" | "reject" | "delete" | null;

type Props = {
  selectedCount: number;
  breakdown: Record<string, number>;
  onApprove: () => void;
  onReject: () => void; // opens confirm
  onDelete: () => void; // opens confirm
  onExport: () => void;
  onClear: () => void;
  busy?: BusyKind;
};

export default function BulkBarUI({
  selectedCount,
  breakdown,
  onApprove,
  onReject,
  onDelete,
  onExport,
  onClear,
  busy = null,
}: Props) {
  const disabled = selectedCount === 0 || busy !== null;

  const summary =
    selectedCount > 0
      ? `${selectedCount} selected` +
        Object.entries(breakdown)
          .map(([status, n]) => ` · ${n} ${status}`)
          .join("")
      : "No selection";

  return (
    <div className="admin-bulkbar z-[29] flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-neutral-700">{summary}</div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ActionButton
          label="Approve"
          icon={<CheckCircle2 className="h-4 w-4" />}
          onClick={onApprove}
          disabled={disabled}
          busy={busy === "approve"}
          variant="success"
          title="Approve selected (Ctrl+Enter)"
        />
        <ActionButton
          label="Reject"
          icon={<XCircle className="h-4 w-4" />}
          onClick={onReject}
          disabled={disabled}
          busy={busy === "reject"}
          variant="danger"
          title="Reject selected"
        />
        <ActionButton
          label="Delete"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
          disabled={disabled}
          busy={busy === "delete"}
          variant="neutral"
          title="Delete selected"
        />
        <GhostButton
          label="Export"
          icon={<FileDown className="h-4 w-4" />}
          onClick={onExport}
          disabled={disabled}
          title="Export selected to CSV"
        />
        <GhostButton label="Clear" onClick={onClear} disabled={disabled} title="Clear selection" />

        {/* Hotkeys helper */}
        <div className="relative group ml-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600 shadow-sm hover:bg-neutral-50"
            title="Keyboard shortcuts"
          >
            <HelpCircle className="h-4 w-4" />
            Shortcuts
          </button>
          <div className="admin-popover pointer-events-none absolute right-0 top-full mt-2 hidden w-64 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-700 shadow-lg group-hover:block">
            <p className="mb-1 flex items-center justify-between">
              <span>Select all on page</span>
              <kbd className="kbd">A</kbd>
            </p>
            <p className="mb-1 flex items-center justify-between">
              <span>Clear selection</span>
              <kbd className="kbd">X</kbd>
            </p>
            <p className="mb-1 flex items-center justify-between">
              <span>Prev / Next page</span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">←</kbd>
                <kbd className="kbd">→</kbd>
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Approve selected</span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">Ctrl</kbd>
                <kbd className="kbd">Enter</kbd>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Buttons ---------- */

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  busy,
  variant = "neutral",
  title,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "success" | "danger" | "neutral";
  title?: string;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1";
  const look =
    variant === "success"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300"
      : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-300";

  return (
    <button className={`${base} ${look}`} onClick={onClick} disabled={disabled || busy} title={title}>
      {busy ? <Spinner /> : icon}
      {label}
    </button>
  );
}

function GhostButton({
  label,
  icon,
  onClick,
  disabled,
  title,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-1"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
      {label}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4z" fill="currentColor" className="opacity-75" />
    </svg>
  );
}

/* Tailwind “kbd” utility (no styled-jsx) */
declare module "react" {
  interface HTMLAttributes<T> {
    // allow className "kbd" without TS complaining
  }
}
