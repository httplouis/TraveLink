"use client";
import * as React from "react";
import type { Vehicle, VehicleFilters } from "@/lib/admin/vehicles/types";
import { VehiclesRepo } from "@/lib/admin/vehicles/store";
import { FiltersBar, VehiclesTable, VehicleForm, BulkBar } from "@/components/admin/vehicles/ui";
import { Plus } from "lucide-react";

export default function VehiclesPageClient() {
  const [rows, setRows] = React.useState<Vehicle[]>([]);
  const [filters, setFilters] = React.useState<VehicleFilters>({});
  const [selection, setSelection] = React.useState<string[]>([]);
  const [form, setForm] = React.useState<null | { mode:"create" } | { mode:"edit"; id:string }>(null);

  const refresh = React.useCallback(() => {
    setRows(VehiclesRepo.list(filters));
  }, [filters]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const onCreate = (data: Omit<Vehicle,"id"|"createdAt"|"updatedAt">) => {
    VehiclesRepo.create(data);
    setForm(null);
    refresh();
  };
  const onUpdate = (id: string, data: Omit<Vehicle,"id"|"createdAt"|"updatedAt">) => {
    VehiclesRepo.update(id, data);
    setForm(null);
    refresh();
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    VehiclesRepo.remove(id);
    setSelection(s => s.filter(x => x !== id));
    refresh();
  };

  const onDeleteSelected = () => {
    if (selection.length === 0) return;
    if (!confirm(`Delete ${selection.length} selected item(s)?`)) return;
    VehiclesRepo.bulkRemove(selection);
    setSelection([]);
    refresh();
  };

  const exportCSV = () => {
    const { toCSV } = require("@/lib/admin/vehicles/utils");
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "vehicles.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const current = form && form.mode === "edit" ? VehiclesRepo.get(form.id) ?? undefined : undefined;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vehicles</h1>
        <button
          onClick={() => setForm({ mode: "create" })}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white"
          style={{ background: "#7a0019" }}
        >
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      <FiltersBar
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
      />

      <BulkBar
        selection={selection}
        rows={rows}
        onDeleteSelected={onDeleteSelected}
        onExportCSV={exportCSV}
      />

      <VehiclesTable
        rows={rows}
        selection={selection}
        setSelection={setSelection}
        onEdit={(id) => setForm({ mode: "edit", id })}
        onDelete={onDelete}
      />

      {/* drawer-like modal */}
      {form && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="w-[min(780px,96vw)] max-h-[90vh] overflow-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                {form.mode === "create" ? "Add Vehicle" : `Edit ${current?.code ?? ""}`}
              </h2>
              <button onClick={() => setForm(null)} className="px-2 py-1 rounded-md border bg-white">Close</button>
            </div>
            <VehicleForm
              initial={current}
              onCancel={() => setForm(null)}
              onSubmit={(data) =>
                form.mode === "create"
                  ? onCreate(data)
                  : onUpdate((form as any).id, data)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
