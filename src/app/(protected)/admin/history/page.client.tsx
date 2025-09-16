"use client";
import * as React from "react";
import type { LogEntry, LogFilters } from "@/lib/admin/logs/types";
import { LogsFiltersBar } from "@/components/admin/logs/FiltersBar.ui";
import { LogsTable } from "@/components/admin/logs/LogsTable.ui";
import { LogDetails } from "@/components/admin/logs/LogDetails.ui";
import { SummaryCards } from "@/components/admin/logs/SummaryCards.ui";
import {
  loadLogs, deleteLog, clearLogs, exportLogsCSV, getAnalytics
} from "@/lib/admin/logs/handlers";
import { Download, Trash2 } from "lucide-react";

export default function HistoryLogsPageClient(){
  const [filters, setFilters] = React.useState<LogFilters>({});
  const [rows, setRows] = React.useState<LogEntry[]>([]);
  const [selection, setSelection] = React.useState<string[]>([]);
  const [viewId, setViewId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => setRows(loadLogs(filters)), [filters]);
  React.useEffect(()=>{ refresh(); }, [refresh]);

  const onDelete = (id: string) => { if(confirm("Delete this log?")) { deleteLog(id); refresh(); } };
  const onDeleteSelected = () => {
    if (!selection.length) return;
    if (!confirm(`Delete ${selection.length} selected log(s)?`)) return;
    selection.forEach(id => deleteLog(id));
    setSelection([]); refresh();
  };
  const onClearAll = () => {
    if (confirm("Clear ALL logs? This is irreversible.")) { clearLogs(); setSelection([]); refresh(); }
  };
  const onExport = () => {
    const blob = exportLogsCSV(rows);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "history-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const current = rows.find(r => r.id === viewId) ?? null;
  const analytics = getAnalytics(rows);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">History / Logs</h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onExport} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white">
            <Download size={16}/> Export CSV
          </button>
          <button disabled={!selection.length} onClick={onDeleteSelected} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white disabled:opacity-50">
            <Trash2 size={16}/> Delete Selected
          </button>
          <button onClick={onClearAll} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white">
            <Trash2 size={16}/> Clear All
          </button>
        </div>
      </div>

      {/* Summary Cards + Trends */}
      <SummaryCards
        total={analytics.totals.all}
        info={analytics.totals.info}
        warning={analytics.totals.warning}
        error={analytics.totals.error}
        topActions={analytics.topActions}
        trend7d={analytics.trend7d}
      />

      <LogsFiltersBar value={filters} onChange={setFilters} onClear={()=>setFilters({})} />

      <LogsTable
        rows={rows}
        selection={selection}
        setSelection={setSelection}
        onView={(id)=>setViewId(id)}
        onDelete={onDelete}
      />

      {current && <LogDetails log={current} onClose={()=>setViewId(null)} />}
    </div>
  );
}
