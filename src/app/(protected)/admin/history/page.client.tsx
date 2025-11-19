// src/app/(protected)/admin/history/page.client.tsx
"use client";

import * as React from "react";
import type { HistoryItem, HistoryFilters, HistoryStats } from "@/lib/admin/history/types";
import { queryHistory, getHistoryStats } from "@/lib/admin/history/store";
import HistoryStatsCards from "@/components/admin/history/HistoryStatsCards.ui";
import HistoryFiltersBar from "@/components/admin/history/HistoryFiltersBar.ui";
import HistoryTable from "@/components/admin/history/HistoryTable.ui";
import { Download, FileText } from "lucide-react";
import { downloadCsv } from "@/lib/common/csv";

export default function HistoryPageClient() {
  const [filters, setFilters] = React.useState<HistoryFilters>({});
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [data, setData] = React.useState<HistoryItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<HistoryStats>({
    totalRequests: 0,
    totalMaintenance: 0,
    totalCost: 0,
    completedThisMonth: 0,
  });
  const [selectedItem, setSelectedItem] = React.useState<HistoryItem | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [historyResult, statsResult] = await Promise.all([
        queryHistory(filters, page, pageSize),
        getHistoryStats(),
      ]);

      setData(historyResult.data);
      setTotal(historyResult.total);
      setStats(statsResult);
    } catch (error) {
      console.error("[HistoryPage] Error loading data:", error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onExport = React.useCallback(() => {
    if (!data.length) return;
    downloadCsv("history-export.csv", data);
  }, [data]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-neutral-50 to-neutral-100 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500 mb-1">Admin • History</div>
          <h1 className="text-3xl font-bold text-neutral-900">History</h1>
          <p className="text-sm text-neutral-600 mt-1">Completed requests and maintenance records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7a1f2a] to-[#9a2f3a] text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && <HistoryStatsCards stats={stats} />}

      {/* Filters */}
      <HistoryFiltersBar
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl shadow-md">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#7a1f2a]"></div>
            <p className="mt-2 text-neutral-600">Loading history...</p>
          </div>
        </div>
      ) : (
        <HistoryTable rows={data} onView={setSelectedItem} />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-xl px-6 py-4 shadow-sm border border-neutral-200">
        <div className="text-sm text-neutral-600 font-medium">
          Showing <span className="font-semibold text-neutral-900">{(data.length && (page - 1) * pageSize + 1) || 0}</span>
          {" – "}
          <span className="font-semibold text-neutral-900">{(page - 1) * pageSize + data.length}</span> of{" "}
          <span className="font-semibold text-neutral-900">{total}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 hover:border-[#7a1f2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
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
          >
            Next
          </button>
        </div>
      </div>

      {/* Details Modal (TODO: Implement if needed) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">History Details</h2>
            <pre className="text-sm">{JSON.stringify(selectedItem, null, 2)}</pre>
            <button
              onClick={() => setSelectedItem(null)}
              className="mt-4 px-4 py-2 bg-[#7a1f2a] text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
