"use client";

import * as React from "react";
import type { Driver } from "@/lib/admin/drivers/types";
import { DriversRepo } from "@/lib/admin/drivers/store";
import DriversTable from "@/components/admin/drivers/ui/DriversTable.ui";
import DriverForm from "@/components/admin/drivers/ui/DriverForm.ui";
import FiltersBar from "@/components/admin/drivers/ui/FiltersBar.ui";
import BulkBar from "@/components/admin/drivers/ui/BulkBar.ui";


export default function DriversPageClient() {
  const [rows, setRows] = React.useState<Driver[]>([]);
  const [filters, setFilters] = React.useState<{ search?: string; status?: string; compliant?: "ok" | "warn" | "bad" | "" }>({});
  const [selection, setSelection] = React.useState<string[]>([]);
  const [form, setForm] = React.useState<null | { mode: "create" } | { mode: "edit"; id: string }>(null);

  const refresh = React.useCallback(() => setRows(DriversRepo.list(filters)), [filters]);
  React.useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-4 p-4">
      <FiltersBar
        value={filters}
        onChange={(v) => { setSelection([]); setFilters(v); }}
        onAdd={() => setForm({ mode: "create" })}
      />

      {selection.length > 0 && (
        <BulkBar
          count={selection.length}
          onSuspend={() => { DriversRepo.bulkUpdate(selection, { status: "suspended" }); setSelection([]); refresh(); }}
          onActivate={() => { DriversRepo.bulkUpdate(selection, { status: "active" }); setSelection([]); refresh(); }}
          onArchive={() => { DriversRepo.bulkUpdate(selection, { status: "archived" }); setSelection([]); refresh(); }}
          onExport={() => DriversRepo.exportCsv(selection.length ? rows.filter(r => selection.includes(r.id)) : rows)}
          onClear={() => setSelection([])}
        />
      )}

      <DriversTable
        rows={rows}
        selected={selection}
        onSelectedChange={setSelection}
        onEdit={(id) => setForm({ mode: "edit", id })}
      />

      {form && (
        <DriverForm
          mode={form.mode}
          driver={form.mode === "edit" ? rows.find(r => r.id === (form as any).id) : undefined}
          onClose={() => setForm(null)}
          onSubmit={(data) => {
            if (form.mode === "create") DriversRepo.create(data as any);
            else DriversRepo.update({ id: (form as any).id, ...(data as any) });
            setForm(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
