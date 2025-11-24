"use client";
import * as React from "react";
import type { TripRow } from "@/lib/admin/report/types";

export function ReportTable({
  rows,
  tableId = "report-table",
}: {
  rows: TripRow[];
  tableId?: string;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Completed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Rejected": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <div className="overflow-auto rounded-xl bg-white shadow-lg ring-1 ring-black/5">
      <table id={tableId} className="min-w-full">
        <thead className="sticky top-0 z-10 bg-gradient-to-b from-[#7a1f2a] to-[#8a2f3a] text-white">
          <tr className="text-xs font-semibold uppercase tracking-wide">
            {["ID","Type","Department","Purpose","Date","Status","Vehicle","Driver","Budget","KM"].map((h) => (
              <th key={h} className="px-6 py-4 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm [&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-neutral-50/50">
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl">📊</div>
                  <div className="text-sm font-medium text-neutral-500">No records found</div>
                  <div className="text-xs text-neutral-400">Try adjusting your filters</div>
                </div>
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-neutral-200/60 last:border-0 hover:bg-[#7a1f2a]/5 transition-colors">
              <td className="px-6 py-3 font-medium text-neutral-900">{r.id}</td>
              <td className="px-6 py-3">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  r.requestType === "seminar" 
                    ? "bg-purple-100 text-purple-700 border border-purple-200" 
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}>
                  {r.requestType === "seminar" ? "Seminar" : "Travel"}
                </span>
              </td>
              <td className="px-6 py-3 text-neutral-700">{r.department}</td>
              <td className="px-6 py-3 text-neutral-700">{r.purpose}</td>
              <td className="px-6 py-3 text-neutral-600">{r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}</td>
              <td className="px-6 py-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(r.status)}`}>
                  {r.status}
                </span>
              </td>
              <td className="px-6 py-3 text-neutral-700">{r.vehicleCode}</td>
              <td className="px-6 py-3 text-neutral-700">{r.driver}</td>
              <td className="px-6 py-3 text-neutral-600 font-medium">
                {r.budget ? `₱${r.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₱0.00"}
              </td>
              <td className="px-6 py-3 text-neutral-600 font-medium">{r.km || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
