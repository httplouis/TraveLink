"use client";

import * as React from "react";
import type { RequestRow } from "@/lib/admin/types";

type Props = {
  rows: RequestRow[];
  filename?: string;
};

export default function DashboardActions({ rows, filename = "requests.csv" }: Props) {
  const exportCsv = () => {
    const header = ["ID", "Requester", "Vehicle", "Date", "Status"];
    const body = rows.map((r) => [
      r.id ?? "",
      r.requester ?? "",
      r.vehicle ?? "",
      r.date ?? "",
      r.status ?? "",
    ]);

    const csv = [header, ...body]
      .map((cols) => cols.map(esc).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="print:hidden flex items-center gap-2">
      {/* Export Button */}
      <button
        type="button"
        onClick={exportCsv}
        className="inline-flex items-center rounded-md bg-[#7A0010] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#60000C] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7A0010]"
      >
        Export CSV
      </button>

      {/* Print Button */}
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center rounded-md bg-[#7A0010] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#60000C] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7A0010]"
      >
        Print
      </button>
    </div>
  );
}

function esc(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
