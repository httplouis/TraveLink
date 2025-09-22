"use client";

import * as React from "react";
import { ReportFilterBar } from "@/components/admin/report/ui/ReportFilterBar.ui";
import { ReportTable } from "@/components/admin/report/ui/ReportTable.ui";
import { ExportBar } from "@/components/admin/report/ui/ExportBar.ui";
import type { ReportFilters, TripRow } from "@/lib/admin/report/types";
import { queryReport } from "@/lib/admin/report/store";

/* 🔁 Shared primitives */
import { useHotkeys } from "@/lib/common/useHotkeys";
import { downloadCsv } from "@/lib/common/csv";

export default function ReportPage() {
  const [filters, setFilters] = React.useState<ReportFilters>({});
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [data, setData] = React.useState<{ rows: TripRow[]; total: number }>({ rows: [], total: 0 });

  const load = React.useCallback(async () => {
    const res = await queryReport(filters, page, pageSize);
    setData({ rows: res.rows, total: res.total });
  }, [filters, page, pageSize]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const tableId = "report-table";

  /* Export helper (current page rows) */
  const onExportCurrent = React.useCallback(() => {
    if (!data.rows.length) return;
    downloadCsv("report-export.csv", data.rows);
  }, [data.rows]);

  /* ⌨️ Hotkeys
     - Ctrl+Enter = Export current page
     - ArrowLeft/Right = pagination
  */
  useHotkeys(
    [
      { key: "Enter", ctrl: true, handler: onExportCurrent },
      { key: "ArrowLeft", handler: () => setPage((p) => Math.max(1, p - 1)) },
      { key: "ArrowRight", handler: () => setPage((p) => Math.min(totalPages, p + 1)) },
    ],
    { ignoreWhileTyping: true }
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Report / Exports</h1>

      <ReportFilterBar
        value={filters}
        onChange={(v) => {
          setPage(1);
          setFilters(v);
        }}
        onClear={() => {
          setPage(1);
          setFilters({});
        }}
      />

      {/* Keep your existing ExportBar for full dataset export; add our hotkey export for quick current-page CSV */}
      <ExportBar rows={data.rows} tableId={tableId} />

      <ReportTable rows={data.rows} tableId={tableId} />

      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">
          Showing {(data.rows.length && (page - 1) * pageSize + 1) || 0}
          {"–"}
          {(page - 1) * pageSize + data.rows.length} of {data.total}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            title="ArrowLeft"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            title="ArrowRight"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
