"use client";
import { Plus, Trash2, Download } from "lucide-react";

export default function Toolbar({
  selectedCount,
  onAdd,
  onExport,
  onDeleteSelected,
}: {
  selectedCount: number;
  onAdd: () => void;
  onExport: () => void;
  onDeleteSelected: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium">Maintenance</div>
      <div className="flex items-center gap-2">
        <button onClick={onExport} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm">
          <Download size={16}/> Export CSV
        </button>
        <button disabled={!selectedCount} onClick={onDeleteSelected} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm disabled:opacity-50">
          <Trash2 size={16}/> Delete Selected
        </button>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-md bg-[#7A0010] px-3 py-1.5 text-sm text-white">
          <Plus size={16}/> Add
        </button>
      </div>
    </div>
  );
}
