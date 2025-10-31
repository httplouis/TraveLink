"use client";

import * as React from "react";

/* Types */
import type { Maintenance, MaintFilters } from "@/lib/admin/maintenance/types";

/* Data handlers (facade) */
import {
  loadMaintenance as query,
  createMaintenance as upsert,
  updateMaintenance as patch,
  deleteMaintenance as remove,
  deleteManyMaintenance as removeMany,
  exportMaintenanceCSV as exportCSV,
} from "@/lib/admin/maintenance/handlers";

/* Dev helpers */
import { seedMaintenance, clearAllMaintenance } from "@/lib/admin/maintenance/mocks";

/* UI */
import MaintenanceKpiBar from "@/components/admin/maintenance/kpi/MaintenanceKpiBar.ui";
import MaintFiltersBar from "@/components/admin/maintenance/filters/MaintenanceFilterBar.ui";
import Table, { type MaintTableHandle } from "@/components/admin/maintenance/table";
import RecordDrawer from "@/components/admin/maintenance/ui/MaintenanceDrawer.ui";
import NewReportModal from "@/components/admin/maintenance/forms/NewReportModal.ui";

/* Local defaults */
const DEFAULT_FILTERS: MaintFilters = {
  search: "",
  type: "all",
  status: "all",
  due: "all",
};

type FormState =
  | { mode: "create" }
  | { mode: "edit"; id: string }
  | null;

export default function MaintenancePageContainer() {
  const tableRef = React.useRef<MaintTableHandle | null>(null);

  const [rows, setRows] = React.useState<Maintenance[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [filters, setFilters] = React.useState<MaintFilters>(DEFAULT_FILTERS);
  const [selection, setSelection] = React.useState<string[]>([]);

  const [form, setForm] = React.useState<FormState>(null);
  const [drawerRow, setDrawerRow] = React.useState<Maintenance | null>(null);

  /* Load */
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await query(filters as unknown as Record<string, unknown>);
      setRows(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    load();
  }, [load]);

  /* CRUD Handlers */
  async function onCreate(data: Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">) {
    const created = await upsert(data as any);
    if (created) {
      setForm(null);
      await load();
    }
  }

  async function onUpdate(id: string, data: Partial<Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">>) {
    const updated = await patch(id, data as any);
    if (updated) {
      setForm(null);
      await load();
    }
  }

  async function onDelete(id: string) {
    const ok = await remove(id);
    if (ok) await load();
  }

  async function onDeleteSelected() {
    if (!selection.length) return;
    const ok = await removeMany(selection);
    if (ok) {
      setSelection([]);
      await load();
    }
  }

  async function onExportCSV() {
    await exportCSV(filters as unknown as Record<string, unknown>);
  }

  /* Drawer + Modal helpers */
  function drawerOnClose() {
    setDrawerRow(null);
  }

  function drawerOnEdit(r: Maintenance) {
    setForm({ mode: "edit", id: r.id });
  }

  const initialForModal: Maintenance | undefined =
    form && form.mode === "edit"
      ? rows.find((r) => r.id === (form as { mode: "edit"; id: string }).id)
      : undefined;

  /* Dev actions (optional buttons can call these via Toolbar if you have one) */
  async function onSeed() {
    await seedMaintenance();
    await load();
  }

  async function onClearAll() {
    await clearAllMaintenance();
    await load();
  }

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <MaintenanceKpiBar items={rows} />

      {/* Filters */}
      <MaintFiltersBar
        value={filters}
        onChange={(f: MaintFilters) => setFilters(f)}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Table */}
      <Table
        ref={tableRef}
        rows={rows}
        loading={loading}
        /* Selection (if your Table supports it) */
        selection={selection}
        onSelectionChange={(ids: string[]) => setSelection(ids)}
        /* Inline actions bridge back here */
        onUpdated={async () => {
          await load();
        }}
        onDeleted={async (id: string) => {
          await onDelete(id);
        }}
        onView={(r: Maintenance) => setDrawerRow(r)}
        onEdit={(r: Maintenance) => drawerOnEdit(r)}
        onExport={onExportCSV}
        onDeleteSelected={onDeleteSelected}
      />

      {/* Drawer (record details) */}
      <RecordDrawer
        open={!!drawerRow}
        row={drawerRow}
        onClose={drawerOnClose}
      />

      {/* Create / Edit */}
      {form && (
        <NewReportModal
          open={!!form}
          initial={initialForModal}
          onClose={() => setForm(null)}
          onSubmit={(data: Maintenance) => {
            if (form.mode === "create") {
              // when NewReportModal returns a full Maintenance, pass only allowed fields to upsert
              const {
                id, createdAt, updatedAt, history, ...rest
              } = data as any;
              return onCreate(rest as any);
            } else {
              const {
                id, createdAt, updatedAt, history, ...rest
              } = data as any;
              return onUpdate(form.id, rest as any);
            }
          }}
        />
      )}

      {/* Optional dev utilities — wire these to buttons in your toolbar if you want */}
      <div className="hidden">
        <button onClick={onSeed}>Seed</button>
        <button onClick={onClearAll}>Clear</button>
      </div>
    </div>
  );
}
