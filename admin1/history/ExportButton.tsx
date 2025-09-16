// src/components/admin/history/ExportButton.tsx
"use client";

import { Download } from "lucide-react";
import { HistoryItem, exportHistoryCSV } from "@/lib/history";

export default function ExportButton({ rows }: { rows: HistoryItem[] }) {
  const onExport = () => {
    const csv = exportHistoryCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travilink-history-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={onExport}
      className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-white shadow-sm"
      style={{ background: "#7A0010" }}
      title="Export filtered rows to CSV"
    >
      <Download className="w-4 h-4" />
      <span className="text-sm font-medium">Export CSV</span>
    </button>
  );
}
