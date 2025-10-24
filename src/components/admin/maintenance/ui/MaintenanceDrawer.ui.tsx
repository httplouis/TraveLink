"use client";
import * as React from "react";
import type { Maintenance } from "@/lib/admin/maintenance/types";
import { X } from "lucide-react";
import AttachmentsGrid from "./AttachmentsGrid.ui";

function peso(v?: number | null){ if(v==null) return "—"; return `PHP ${new Intl.NumberFormat("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)}`; }
function fmt(iso?: string){ return iso ? new Date(iso).toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"2-digit"}) : "—"; }

export default function MaintenanceDrawer({ open, row, onClose }: { open: boolean; row: Maintenance | null; onClose: () => void }) {
  if (!open || !row) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-2xl">
        <header className="flex items-center justify-between h-14 border-b px-5">
          <div className="font-semibold">Maintenance Record</div>
          <button onClick={onClose} className="p-2 rounded hover:bg-neutral-100"><X size={18}/></button>
        </header>

        <div className="p-5 space-y-6 overflow-auto h-[calc(100%-56px)]">
          <section className="grid grid-cols-2 gap-3">
            <Field label="Vehicle" value={row.vehicle} />
            <Field label="Type" value={row.type} />
            <Field label="Status" value={row.status} />
            <Field label="Date" value={fmt(row.date)} />
            <Field label="Vendor" value={row.vendor || "—"} />
            <Field label="Cost" value={peso(row.costPhp ?? undefined)} />
            <Field label="Next Due" value={row.nextDueDateISO ? `${fmt(row.nextDueDateISO)}${row.nextDueOdometer ? ` • ${row.nextDueOdometer.toLocaleString()} km` : ""}` : "—"} />
            <Field label="Odo @ Service" value={row.odometerAtService != null ? `${row.odometerAtService.toLocaleString()} km` : "—"} />
          </section>

          {row.description && (
            <section>
              <div className="text-xs text-neutral-500 mb-1">Description</div>
              <div className="text-neutral-800">{row.description}</div>
            </section>
          )}

          <section>
            <div className="text-xs text-neutral-500 mb-2">Attachments</div>
            <AttachmentsGrid items={row.attachments || []} />
          </section>

          <section>
            <div className="text-xs text-neutral-500 mb-2">History</div>
            <div className="space-y-2">
              {(row.history || []).map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-[#7a1f2a]" />
                  <div>
                    <div className="text-neutral-900">{h.action}</div>
                    <div className="text-xs text-neutral-500">{new Date(h.atISO).toLocaleString()} • {h.actor}</div>
                    {h.notes && <div className="text-xs text-neutral-700">{h.notes}</div>}
                  </div>
                </div>
              ))}
              {!row.history?.length && <div className="text-neutral-400 italic">No history</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-neutral-900">{value}</div>
    </div>
  );
}
