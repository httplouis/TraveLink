"use client";
import * as React from "react";
import type { Maintenance, MaintFilters, MaintStatus } from "@/lib/admin/maintenance/types";
import { loadMaintenance, createMaintenance, updateMaintenance, deleteMaintenance, deleteManyMaintenance, exportMaintenanceCSV } from "@/lib/admin/maintenance/handlers";
import { seedMockMaintenance, clearAllMaintenance } from "@/lib/admin/maintenance/mocks";

import MaintenanceKpiBar from "../kpi/MaintenanceKpiBar.ui";
import MaintFiltersBar from "../filters/FiltersBar.ui";
import Table, { type MaintTableHandle } from "../table";
import MaintenanceDrawer from "../ui/MaintenanceDrawer.ui";
import NewReportModal from "../forms/NewReportModal.ui";

const DEFAULT_FILTERS: MaintFilters = {
  q: "",
  category: "all",
  status: "all",
  due: "all",
  density: "comfortable",
};

export default function MaintenancePageContainer() {
  const [filters, setFilters] = React.useState<MaintFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = React.useState<Maintenance[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    setLoading(true);
    setRows(loadMaintenance(filters));
    setLoading(false);
  }, [filters]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const [selection, setSelection] = React.useState<string[]>([]);
  const [form, setForm] = React.useState<null | { mode:"create" } | { mode:"edit"; id:string }>(null);
  const [view, setView] = React.useState<Maintenance | null>(null);
  const tableRef = React.useRef<MaintTableHandle>(null);

  // Status inline change
  const onChangeStatus = (id: string, next: MaintStatus) => {
    updateMaintenance(id, { status: next } as any);
    refresh();
  };

  // CRUD
  const onCreate = (data: Omit<Maintenance,"id"|"createdAt"|"updatedAt"|"history">) => { createMaintenance(data); setForm(null); refresh(); };
  const onUpdate = (id: string, data: Omit<Maintenance,"id"|"createdAt"|"updatedAt"|"history">) => { updateMaintenance(id, data); setForm(null); refresh(); };
  const onDelete = (id: string) => { if (confirm("Delete this record?")) { deleteMaintenance(id); refresh(); } };
  const onDeleteSelected = () => {
    if (!selection.length) return;
    if (confirm(`Delete ${selection.length} selected record(s)?`)) {
      deleteManyMaintenance(selection);
      setSelection([]);
      refresh();
    }
  };
  const onExport = () => {
    const blob = exportMaintenanceCSV(rows);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "maintenance.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const onView = (id: string) => setView(rows.find((r)=>r.id===id) || null);
  const onEdit = (id: string) => setForm({ mode:"edit", id });

  const current = form?.mode === "edit" ? rows.find((r)=>r.id === (form as any).id) : undefined;

  // KPI
  const kpi = React.useMemo(() => {
    const s = (t: MaintStatus) => rows.filter(r=>r.status===t).length;
    const d = (n: "ok"|"soon"|"overdue") => rows.filter(r=>r.nextDueTint===n).length;
    return { all: rows.length, submitted: s("Submitted"), inProgress: s("In-Progress"), completed: s("Completed"), dueSoon: d("soon"), overdue: d("overdue") };
  }, [rows]);

  return (
    <div className="p-4 space-y-4">
      <MaintenanceKpiBar {...kpi} />
      <MaintFiltersBar value={filters} onChange={setFilters} onClear={() => setFilters(DEFAULT_FILTERS)} />

      <Table
        ref={tableRef}
        loading={loading}
        rows={rows}
        selection={selection}
        setSelection={setSelection}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onExport={onExport}
        onDeleteSelected={onDeleteSelected}
        onAdd={() => setForm({ mode:"create" })}
        pageSize={10}
        onChangeStatus={onChangeStatus}
        onSeedDemo={() => { seedMockMaintenance(12); refresh(); }}
        onClearAll={() => { if (confirm("Clear all maintenance records?")) { clearAllMaintenance(); refresh(); } }}
      />

      <MaintenanceDrawer open={!!view} row={view} onClose={() => setView(null)} />

      <NewReportModal
        open={!!form}
        initial={current}
        onClose={() => setForm(null)}
        onSubmit={(data) => form?.mode === "create" ? onCreate(data) : onUpdate((form as any).id, data)}
      />
    </div>
  );
}
