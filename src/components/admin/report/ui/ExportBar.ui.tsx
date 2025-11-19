"use client";
import * as React from "react";
import type { TripRow } from "@/lib/admin/report/types";
import { downloadCSV, getHistory, printElementById } from "@/lib/admin/report/export";
import { FileDown, Printer } from "lucide-react";

export function ExportBar({
  rows,
  tableId,
}: {
  rows: TripRow[];
  tableId: string;
}) {
  const [history, setHistory] = React.useState(getHistory());

  const handleCSV = () => {
    downloadCSV(rows);
    setHistory(getHistory());
  };
  const handlePrint = () => {
    printElementById(tableId);
    setHistory(getHistory());
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleCSV}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7a1f2a] to-[#9a2f3a] text-white px-4 py-2.5 text-sm font-medium hover:from-[#6a1a24] hover:to-[#8a1f2a] transition-all shadow-md hover:shadow-lg"
        >
          <FileDown size={18} /> Export CSV
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 hover:border-[#7a1f2a] transition-colors"
        >
          <Printer size={18} /> Print
        </button>
      </div>

      <div className="flex-1" />

      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm min-w-[200px]">
        <div className="text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Recent Exports</div>
        <ul className="max-h-24 overflow-auto text-xs leading-5 pr-1 space-y-1">
          {history.length === 0 && <li className="text-neutral-400 italic">No export activity yet.</li>}
          {history.map((h, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-neutral-600">
              <span className="font-medium">{h.type}</span>
              <span className="text-neutral-400 text-[10px]">{new Date(h.at).toLocaleString()}</span>
              <span className="text-neutral-500">{h.count} rows</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
