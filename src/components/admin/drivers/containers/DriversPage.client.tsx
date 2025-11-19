"use client";
import * as React from "react";

// top bars
import { DriversHeader } from "../filters/DriversHeader.ui";
import { DriversFilterBar } from "../filters/DriversFilterBar.ui";
import { DriversBulkBar } from "../toolbar/DriversBulkBar.ui";
import DriversURLSync from "@/components/admin/drivers/DriversURLSync";

// main views
import { DriversGrid } from "../ui/DriversGrid.ui";
import { DriversTable } from "../ui/DriversTable.ui";
import DriverDetailsModal from "../ui/DriverDetailsModal.ui";
import { DriverFormModal } from "../forms/DriverFormModal.ui";

// state
import { useDriversScreen } from "../hooks/useDriversScreen";

// repo, utils
import { DriversRepo } from "@/lib/admin/drivers/store";
import { toCSV } from "@/lib/admin/drivers/utils";

// common confirm
import { useConfirm } from "@/components/common/hooks/useConfirm";

export default function DriversPageClient() {
  const {
    filters,
    setFilters,
    rows,
    selection,
    setSelection,
    form,
    setForm,
    view,
    setView,
    tab,
    setTab,
    refresh,
  } = useDriversScreen();

  const [openDetails, setOpenDetails] = React.useState<string | null>(null);
  const current = openDetails ? DriversRepo.get(openDetails) : null;

  // Fetch from Supabase on mount
  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { ask, ui: confirmUI } = useConfirm();

  const onClear = () => setFilters({});
  const onEdit = (id: string) => setForm({ mode: "edit", id });

  const onDelete = async (id: string) => {
    const d = DriversRepo.get(id);
    const ok = await ask(
      "Delete driver?",
      `Are you sure you want to delete ${d ? `${d.firstName} ${d.lastName}` : "this driver"}? This action cannot be undone.`,
      "Delete"
    );
    if (!ok) return;
    DriversRepo.remove(id);
    refresh();
  };

  const onDeleteSelected = async () => {
    if (selection.length === 0) return;
    const ok = await ask(
      "Delete selected drivers?",
      `This will delete ${selection.length} driver(s). This action cannot be undone.`,
      "Delete"
    );
    if (!ok) return;
    selection.forEach(DriversRepo.remove);
    setSelection([]);
    refresh();
  };

  const onExportCSV = () => {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drivers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // counts for header tabs (derive once per rows refresh)
  const counts = React.useMemo(() => {
    const list = DriversRepo.listLocal({});
    const all = list.length;
    const available = list.filter((d) => d.status === "active" && !d.assignedVehicleId).length;
    const on_trip = list.filter((d) => d.status === "on_trip").length;
    const off_duty = list.filter((d) => d.status === "off_duty").length;
    const suspended = list.filter((d) => d.status === "suspended").length;

    const todayISO = new Date().toISOString().slice(0, 10);
    const expired_license = list.filter((d) => (d.licenseExpiryISO ?? "") < todayISO).length;

    return { all, available, on_trip, off_duty, suspended, expired_license };
  }, [rows]);

  // Reset handler removed - no sample data, everything from database

  return (
    <div className="space-y-4 p-4">
      {/* global confirm dialog portal */}
      {confirmUI}

      <DriversHeader
        counts={counts as any}
        tab={tab}
        onTab={(t) => setTab(t)}
        view={view}
        onView={setView}
        onCreate={() => setForm({ mode: "create" })}
      />

      {/* Filters UI */}
      <DriversFilterBar value={filters} onChange={setFilters} onClear={onClear} />

      {/* Filters-only URL sync (keeps URL shareable without touching q/sort) */}
      <DriversURLSync draft={filters as any} onDraftChange={setFilters as any} />

      <div className="flex flex-col gap-3">
        {view === "table" ? (
          <>
            <DriversBulkBar
              selection={selection}
              rows={rows}
              onDeleteSelected={onDeleteSelected}
              onExportCSV={onExportCSV}
            />
            <DriversTable
              rows={rows}
              selection={selection}
              setSelection={setSelection}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </>
        ) : (
          <DriversGrid
            rows={rows}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenDetails={(id) => setOpenDetails(id)}
          />
        )}
      </div>

      {/* Create/Edit modal */}
      {form && (
        <DriverFormModal
          open={!!form}
          initial={form.mode === "edit" ? DriversRepo.get(form.id) ?? undefined : undefined}
          onCancel={() => setForm(null)}
          onSubmit={(data) => {
            if (form.mode === "create") DriversRepo.create(data as any);
            else DriversRepo.update(form.id, data as any);
            setForm(null);
            refresh();
          }}
        />
      )}

      {/* Details modal */}
      <DriverDetailsModal open={!!openDetails} onClose={() => setOpenDetails(null)} d={current as any} />
    </div>
  );
}
