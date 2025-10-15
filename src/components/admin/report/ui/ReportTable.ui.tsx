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
  return (
    <div className="overflow-auto rounded-lg border bg-white">
      <table id={tableId} className="min-w-full">
        <thead className="bg-gray-50 text-sm">
          <tr>
            {["ID","Department","Purpose","Date","Status","Vehicle","Driver","KM"].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2">{r.id}</td>
              <td className="px-3 py-2">{r.department}</td>
              <td className="px-3 py-2">{r.purpose}</td>
              <td className="px-3 py-2">{r.date}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2">{r.vehicleCode}</td>
              <td className="px-3 py-2">{r.driver}</td>
              <td className="px-3 py-2">{r.km}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-sm opacity-60">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
