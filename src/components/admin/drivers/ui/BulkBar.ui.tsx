"use client";
import * as React from "react";

type Props = {
  count: number;
  onSuspend: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onExport: () => void;
  onClear: () => void;
};

export default function BulkBar({ count, onSuspend, onActivate, onArchive, onExport, onClear }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-amber-50 p-3 text-sm">
      <div className="font-medium">{count} selected</div>
      <div className="ml-auto flex items-center gap-2">
        <button className="rounded border px-3 py-1.5 hover:bg-gray-50" onClick={onActivate}>Activate</button>
        <button className="rounded border px-3 py-1.5 hover:bg-gray-50" onClick={onSuspend}>Suspend</button>
        <button className="rounded border px-3 py-1.5 hover:bg-gray-50" onClick={onArchive}>Archive</button>
        <button className="rounded border px-3 py-1.5 hover:bg-gray-50" onClick={onExport}>Export CSV</button>
        <button className="rounded bg-gray-900 px-3 py-1.5 text-white hover:opacity-90" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}
