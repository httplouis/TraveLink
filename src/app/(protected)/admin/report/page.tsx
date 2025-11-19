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
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await queryReport(filters, page, pageSize);
      setData({ rows: res.rows, total: res.total });
    } catch (error) {
      console.error("[ReportPage] Error loading data:", error);
      setData({ rows: [], total: 0 });
    } finally {
      setLoading(false);
    }
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
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-neutral-50 to-neutral-100 min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500 mb-1">Admin • Report</div>
          <h1 className="text-3xl font-bold text-neutral-900">Report / Exports</h1>
        </div>
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl shadow-md">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#7a1f2a]"></div>
            <p className="mt-2 text-neutral-600">Loading reports...</p>
          </div>
        </div>
      ) : (
        <ReportTable rows={data.rows} tableId={tableId} />
      )}

      <div className="flex items-center justify-between bg-white rounded-xl px-6 py-4 shadow-sm border border-neutral-200">
        <div className="text-sm text-neutral-600 font-medium">
          Showing <span className="font-semibold text-neutral-900">{(data.rows.length && (page - 1) * pageSize + 1) || 0}</span>
          {" – "}
          <span className="font-semibold text-neutral-900">{(page - 1) * pageSize + data.rows.length}</span> of <span className="font-semibold text-neutral-900">{data.total}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 hover:border-[#7a1f2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            title="ArrowLeft"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-neutral-700 min-w-[80px] text-center">
            Page {page} / {totalPages}
          </span>
          <button
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 hover:border-[#7a1f2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
