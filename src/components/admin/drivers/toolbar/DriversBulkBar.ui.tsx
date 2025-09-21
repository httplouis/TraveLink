"use client";
import * as React from "react";
import { Download, Trash2 } from "lucide-react";
import type { Driver } from "@/lib/admin/drivers/types";

export function DriversBulkBar({
  selection,
  rows,
  onDeleteSelected,
  onExportCSV,
}: {
  selection: string[];
  rows: Driver[];
  onDeleteSelected: () => void;
  onExportCSV: () => void;
}) {
  const any = selection.length > 0;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          disabled={!any}
          onClick={onDeleteSelected}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          title="Delete selected"
        >
          <Trash2 size={16} /> Delete
        </button>

        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 border"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <span className="text-sm text-gray-600">
        Showing <b>{rows.length}</b> driver{rows.length !== 1 && "s"}
        {any && (
          <span className="ml-2 text-gray-700">
            • <b>{selection.length}</b> selected
          </span>
        )}
      </span>
    </div>
  );
}
