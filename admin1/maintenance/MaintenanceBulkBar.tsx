"use client";

import { MaintVehicle, MaintenanceTicket, exportMaintenanceCSV } from "@/lib/maintenanceDomain";
import { Download, CheckCircle2, X } from "lucide-react";

export default function MaintenanceBulkBar({
  selected,
  vehicles,
  onClear,
  onCompleteMany,
}: {
  selected: MaintenanceTicket[];
  vehicles: MaintVehicle[];
  onClear: () => void;
  onCompleteMany: (ids: string[]) => void;
}) {
  if (selected.length === 0) return null;

  const onExport = () => {
    const csv = exportMaintenanceCSV(selected, vehicles);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travilink-maintenance-selected-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="rounded-2xl shadow-lg border border-neutral-200 bg-white px-4 py-3 flex items-center gap-3">
        <div className="text-sm">
          <b>{selected.length}</b> selected
        </div>
        <button
          onClick={() => onCompleteMany(selected.map(s => s.id))}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-white"
          style={{ background: "#16a34a" }}
          title="Mark all completed"
        >
          <CheckCircle2 className="w-4 h-4" />
          Complete
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-white"
          style={{ background: "#7A0010" }}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClear} title="Clear selection">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
