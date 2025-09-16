"use client";
import * as React from "react";
import type { Maintenance, MaintFilters } from "@/lib/admin/maintenance/types";
import { MaintForm } from "@/components/admin/maintenance/MaintForm.ui";
import { MaintTable } from "@/components/admin/maintenance/MaintTable.ui";
import { MaintFiltersBar } from "@/components/admin/maintenance/FiltersBar.ui";
import {
  loadMaintenance, getMaintenance, createMaintenance, updateMaintenance,
  deleteMaintenance, deleteManyMaintenance, exportMaintenanceCSV
} from "@/lib/admin/maintenance/handlers";
import { Plus, Download, Trash2 } from "lucide-react";

export default function MaintenancePageClient(){
  const [filters, setFilters] = React.useState<MaintFilters>({});
  const [rows, setRows] = React.useState<Maintenance[]>([]);
  const [selection, setSelection] = React.useState<string[]>([]);
  const [form, setForm] = React.useState<null | {mode:"create"} | {mode:"edit"; id:string}>(null);

  const refresh = React.useCallback(() => setRows(loadMaintenance(filters)), [filters]);
  React.useEffect(() => { refresh(); }, [refresh]);

  const onCreate = (data: Omit<Maintenance,"id"|"createdAt"|"updatedAt">) => { createMaintenance(data); setForm(null); refresh(); };
  const onUpdate = (id: string, data: Omit<Maintenance,"id"|"createdAt"|"updatedAt">) => { updateMaintenance(id, data); setForm(null); refresh(); };
  const onDelete = (id: string) => { if(confirm("Delete record?")) { deleteMaintenance(id); refresh(); } };
  const onDeleteSelected = () => { if(selection.length && confirm(`Delete ${selection.length} selected?`)){ deleteManyMaintenance(selection); setSelection([]); refresh(); } };
  const onExport = () => {
    const blob = exportMaintenanceCSV(rows);
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "maintenance.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const current = form && form.mode==="edit" ? getMaintenance(form.id) ?? undefined : undefined;

  return (
    <div className="p-4 space-y-4">
      {/* header actions */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Maintenance</h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onExport} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white">
            <Download size={16}/> Export CSV
          </button>
          <button disabled={!selection.length} onClick={onDeleteSelected} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white disabled:opacity-50">
            <Trash2 size={16}/> Delete Selected
          </button>
          <button onClick={()=>setForm({mode:"create"})} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white" style={{background:"#7a0019"}}>
            <Plus size={16}/> Add Record
          </button>
        </div>
      </div>

      <MaintFiltersBar value={filters} onChange={setFilters} onClear={()=>setFilters({})} />

      <MaintTable
        rows={rows}
        selection={selection}
        setSelection={setSelection}
        onEdit={(id)=>setForm({mode:"edit", id})}
        onDelete={onDelete}
      />

      {form && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="w-[min(760px,96vw)] max-h-[90vh] overflow-auto bg-white rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                {form.mode==="create" ? "Add Maintenance" : `Edit ${current?.vehicleCode}`}
              </h2>
              <button onClick={()=>setForm(null)} className="border rounded-md px-2 py-1 bg-white">Close</button>
            </div>
            <MaintForm
              initial={current}
              onCancel={()=>setForm(null)}
              onSubmit={(data)=> form.mode==="create" ? onCreate(data) : onUpdate((form as any).id, data)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
