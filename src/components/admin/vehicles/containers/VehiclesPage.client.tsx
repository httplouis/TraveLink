"use client";
import * as React from "react";
import { VehiclesFilterBar } from "../filters/VehiclesFilterBar.ui";
import { VehiclesBulkBar } from "../toolbar/VehiclesBulkBar.ui";
import { VehiclesTable } from "../ui/VehiclesTable.ui";
import { VehiclesGrid } from "../ui/VehiclesGrid.ui";
import { VehicleFormModal } from "../forms/VehicleFormModal.ui";
import { VehiclesHeader } from "../filters/VehiclesHeader.ui";
import { VehicleDetailsModal } from "../ui/VehicleDetailsModal.ui";
import { useVehiclesScreen } from "../hooks/useVehiclesScreen";
import { VehiclesRepo } from "@/lib/admin/vehicles/store";
import { toCSV } from "@/lib/admin/vehicles/utils";
import { useConfirm } from "@/components/common/hooks/useConfirm";

export default function VehiclesPageClient() {
  const {
    filters, setFilters,
    rows, selection, setSelection,
    form, setForm,
    view, setView,
    tab, setTab,
    refresh,
  } = useVehiclesScreen();

  const [openDetails, setOpenDetails] = React.useState<string | null>(null);

  // Fetch from Supabase on mount
  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { ask, ui: confirmUI } = useConfirm();

  const onClear = () => setFilters({});
  const onEdit = (id: string) => setForm({ mode: "edit", id });

  const onDelete = async (id: string) => {
    const v = VehiclesRepo.get(id);
    const ok = await ask(
      "Delete vehicle?",
      `Are you sure you want to delete ${v?.plateNo ?? "this vehicle"}? This action cannot be undone.`,
      "Delete"
    );
    if (!ok) return;
    VehiclesRepo.remove(id);
    refresh();
  };

  const onDeleteSelected = async () => {
    if (selection.length === 0) return;
    const ok = await ask(
      "Delete selected vehicles?",
      `This will delete ${selection.length} vehicle(s). This action cannot be undone.`,
      "Delete"
    );
    if (!ok) return;
    selection.forEach(VehiclesRepo.remove);
    setSelection([]);
    refresh();
  };

  const onExportCSV = () => {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // counts for tabs
  const counts = React.useMemo(() => {
    const list = VehiclesRepo.listLocal({});
    return {
      all: list.length,
      assigned: list.filter((v) => (v as any).assignedDriver).length,
      out_of_order: list.filter((v) => v.status === "inactive").length,
      available: list.filter((v) => v.status === "active" && !(v as any).assignedDriver).length,
      service_needed: list.filter((v) => {
        const due = (v as any).nextServiceISO as string | undefined;
        return due && new Date(due) <= new Date();
      }).length,
    };
  }, [rows]);

  const current = openDetails ? (VehiclesRepo.get(openDetails) as any) : null;

  // Reset handler removed - no sample data, everything from database

  return (
    <div className="space-y-4 p-4">
      {/* global confirm dialog mount point */}
      {confirmUI}

      <VehiclesHeader
        counts={counts as any}
        tab={tab}
        onTab={(t) => {
          setTab(t);
        }}
        view={view}
        onView={setView}
        onCreate={() => setForm({ mode: "create" })}
      />

      <VehiclesFilterBar value={filters} onChange={setFilters} onClear={onClear} />

      <div className="flex flex-col gap-3">
        {view === "table" ? (
          <>
            <VehiclesBulkBar
              selection={selection}
              rows={rows}
              onDeleteSelected={onDeleteSelected}
              onExportCSV={onExportCSV}
            />
            <VehiclesTable
              rows={rows}
              selection={selection}
              setSelection={setSelection}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </>
        ) : (
          <VehiclesGrid
            rows={rows as any}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenDetails={(id) => setOpenDetails(id)}
          />
        )}
      </div>

      {/* Create/Edit modal */}
      {form && (
        <VehicleFormModal
          open={!!form}
          initial={form.mode === "edit" ? VehiclesRepo.get(form.id) ?? undefined : undefined}
          onCancel={() => setForm(null)}
          onSubmit={(data) => {
            if (form.mode === "create") VehiclesRepo.create(data);
            else VehiclesRepo.update(form.id, data);
            setForm(null);
            refresh();
          }}
        />
      )}

      {/* Details modal */}
      <VehicleDetailsModal open={!!openDetails} onClose={() => setOpenDetails(null)} v={current as any} />
    </div>
  );
}
