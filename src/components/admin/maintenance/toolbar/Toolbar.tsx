"use client";
import * as React from "react";
import { Download, Trash2, Plus } from "lucide-react";

export default function Toolbar({
  selectionCount, onExport, onDeleteSelected, onAdd
}: {
  selectionCount: number;
  onExport: () => void;
  onDeleteSelected: () => void;
  onAdd: () => void;
}) {
  const Primary = "bg-[#7a0019] text-white hover:brightness-110";
  const Ghost = "border bg-white hover:bg-gray-50";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExport}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${Ghost}`}
        title="Ctrl+Enter"
        aria-label="Export CSV"
      >
        <Download size={16} /> Export
      </button>

      <button
        disabled={!selectionCount}
        onClick={onDeleteSelected}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${Ghost} disabled:opacity-50`}
        title="Delete selected"
        aria-label="Delete selected"
      >
        <Trash2 size={16} /> Delete ({selectionCount || 0})
      </button>

      <button
        onClick={onAdd}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${Primary}`}
        title="Alt+N"
        aria-label="Add record"
      >
        <Plus size={16} /> Add
      </button>
    </div>
  );
}
