// src/components/admin/common/ReasonModal.ui.tsx
"use client";
import React from "react";

export default function ReasonModalUI({
  open, title = "Reject request?", placeholder = "Reason…", onCancel, onConfirm,
}: {
  open: boolean;
  title?: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [val, setVal] = React.useState("");
  React.useEffect(() => { if (!open) setVal(""); }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <textarea
          className="mb-3 w-full rounded border p-2 text-sm"
          rows={4}
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button className="rounded border px-3 py-1 text-sm" onClick={onCancel}>Cancel</button>
          <button
            className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            disabled={!val.trim()}
            onClick={() => onConfirm(val.trim())}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
