// src/app/(protected)/admin/maintenance/page.client.tsx
"use client";
import * as React from "react";
import type { Maintenance, MaintFilters } from "@/lib/admin/maintenance/types";

/* UI */
import { MaintForm } from "@/components/admin/maintenance/forms/MaintForm.ui";
import { MaintFiltersBar } from "@/components/admin/maintenance/filters/FiltersBar.ui";
import Table, { MaintTableHandle } from "@/components/admin/maintenance/table";

/* Logic/Handlers */
import {
  loadMaintenance,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  deleteManyMaintenance,
  exportMaintenanceCSV,
} from "@/lib/admin/maintenance/handlers";

/* Common primitives */
import Modal from "@/components/common/modal/Modal";
import { useConfirm } from "@/components/common/hooks/useConfirm";
import { useHotkeys } from "@/lib/common/useHotkeys";

export default function MaintenancePageClient() {
  // filters + data
  const [filters, setFilters] = React.useState<MaintFilters>({});
  const [rows, setRows] = React.useState<Maintenance[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const refresh = React.useCallback(() => {
    setLoading(true);
    const data = loadMaintenance(filters);
    setRows(data);
    setLoading(false);
  }, [filters]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // selection + modal
  const [selection, setSelection] = React.useState<string[]>([]);
  const [form, setForm] =
    React.useState<null | { mode: "create" } | { mode: "edit"; id: string }>(null);

  // table ref for page-visible IDs
  const tableRef = React.useRef<MaintTableHandle>(null);

  // confirm dialog (common)
  const { ask, ui: confirmUI } = useConfirm();

  // CRUD handlers
  const onCreate = async (data: Omit<Maintenance, "id" | "createdAt" | "updatedAt">) => {
    createMaintenance(data);
    setForm(null);
    refresh();
  };

  const onUpdate = async (
    id: string,
    data: Omit<Maintenance, "id" | "createdAt" | "updatedAt">
  ) => {
    updateMaintenance(id, data);
    setForm(null);
    refresh();
  };

  const onDelete = async (id: string) => {
    if (await ask("Delete record", "Are you sure you want to delete this record?")) {
      deleteMaintenance(id);
      refresh();
    }
  };

  const onDeleteSelected = async () => {
    if (!selection.length) return;
    if (await ask("Delete selected", `Delete ${selection.length} selected records?`)) {
      deleteManyMaintenance(selection);
      setSelection([]);
      refresh();
    }
  };

  const onExport = () => {
    const blob = exportMaintenanceCSV(rows);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maintenance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const current =
    form && form.mode === "edit" ? getMaintenance(form.id) ?? undefined : undefined;

  /* Hotkeys */
  useHotkeys(
    [
      { key: "n", alt: true, handler: () => setForm({ mode: "create" }) },
      { key: "n", handler: () => setForm({ mode: "create" }) },
      { key: "Enter", ctrl: true, handler: onExport },
      { key: "Delete", handler: onDeleteSelected },
      {
        key: "a",
        handler: () => {
          const ids = tableRef.current?.getVisibleIds() ?? rows.map((r: any) => r.id);
          setSelection(ids);
        },
      },
      { key: "x", handler: () => setSelection([]) },
    ],
    { ignoreWhileTyping: true }
  );

  return (
    <div className="p-4 space-y-4">
      <MaintFiltersBar value={filters} onChange={setFilters} onClear={() => setFilters({})} />

      <Table
        ref={tableRef}
        loading={loading}
        rows={rows}
        selection={selection}
        setSelection={setSelection}
        onEdit={(id) => setForm({ mode: "edit", id })}
        onDelete={onDelete}
        onExport={onExport}
        onDeleteSelected={onDeleteSelected}
        onAdd={() => setForm({ mode: "create" })}
        pageSize={10}
      />

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        ariaLabel="Maintenance Form"
        maxWidth={760}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">
            {form?.mode === "create" ? "Add Maintenance" : `Edit ${current?.vehicleCode ?? ""}`}
          </h2>
          <button
            onClick={() => setForm(null)}
            className="border rounded-md px-2 py-1 bg-white"
          >
            Close
          </button>
        </div>
        <MaintForm
          initial={current}
          onCancel={() => setForm(null)}
          onSubmit={(data) =>
            form?.mode === "create"
              ? onCreate(data)
              : onUpdate((form as any).id, data)
          }
        />
      </Modal>

      {/* Mount confirm dialog UI */}
      {confirmUI}
    </div>
  );
}
