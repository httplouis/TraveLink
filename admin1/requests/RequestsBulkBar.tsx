"use client";

import { RequestItem, exportRequestsCSV } from "@/lib/requests";
import { Download, X } from "lucide-react";

export default function RequestsBulkBar({
  selected,
  onClear,
}: {
  selected: RequestItem[];
  onClear: () => void;
}) {
  if (selected.length === 0) return null;

  const onExport = () => {
    const csv = exportRequestsCSV(selected);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travilink-requests-selected-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="rounded-2xl shadow-lg border border-neutral-200 bg-white px-4 py-3 flex items-center gap-3">
        <div className="text-sm">
          <b>{selected.length}</b> selected
        </div>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-white"
          style={{ background: "#7A0010" }}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClear} title="Clear selection">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
