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
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleCSV}
          className="flex items-center gap-2 rounded-md bg-[#7A0010] text-white px-3 py-2 text-sm hover:opacity-90"
        >
          <FileDown size={16} /> Export CSV
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Printer size={16} /> Print
        </button>
      </div>

      <div className="flex-1" />

      <div className="rounded-md border bg-white p-2">
        <div className="text-xs font-medium mb-1">Recent Exports</div>
        <ul className="max-h-24 overflow-auto text-xs leading-5 pr-1">
          {history.length === 0 && <li className="opacity-60">No export activity yet.</li>}
          {history.map((h, i) => (
            <li key={i} className="flex items-center justify-between gap-4">
              <span>{h.type}</span>
              <span className="opacity-70">{new Date(h.at).toLocaleString()}</span>
              <span className="opacity-70">{h.count} rows</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
