"use client";
import * as React from "react";
import type { Attachment, Driver, MaintRecord, MaintStatus, Vehicle } from "@/lib/admin/maintenance";
import StatusBadge from "./StatusBadge";
import AttachmentsGrid from "./AttachmentsGrid.ui";

type Props = {
  open: boolean;
  row: MaintRecord | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onStatus: (next: MaintStatus, note?: string) => void;
  onOpenLightbox: (args: { files: Attachment[]; index: number }) => void;
};

const STATUS_ORDER: MaintStatus[] = ["Submitted","Acknowledged","In-Progress","Completed","Rejected"];

export default function RecordDrawer({
  open, row, vehicles, drivers, onClose, onStatus, onOpenLightbox,
}: Props) {
  const veh = row ? vehicles.find((v) => v.id === row.vehicleId) : null;
  if (!open || !row) return null;

  const imgIndex = row.attachments.findIndex(a => a.mime.startsWith("image/"));
  const preview = imgIndex >= 0 ? row.attachments[imgIndex] : null;

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/30" onClick={onClose}/>
      <div className="w-[560px] max-w-[92vw] bg-white border-l overflow-y-auto">
        <div className="p-4 border-b bg-[#7a1f2a]/5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs text-gray-500">Maintenance record</div>
              <div className="text-lg font-semibold text-gray-900">{veh?.name || row.vehicleId}</div>
              <div className="mt-1"><StatusBadge status={row.status} /></div>
            </div>
            <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <div className="text-sm font-medium mb-2">Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => (
                <button key={s} onClick={()=>onStatus(s)} disabled={row.status===s}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          row.status===s ? "bg-[#7a1f2a] text-white border-[#7a1f2a]" : "hover:bg-gray-50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <section>
            <div className="text-sm font-medium mb-2">Details</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Type" value={row.type}/>
              <Field label="Created" value={`${row.createdAt} • ${row.createdBy}`}/>
              <Field label="Vendor" value={row.vendor || "—"}/>
              <Field label="Odometer" value={row.odometer?.toString() ?? "—"}/>
              <Field label="Cost" value={row.cost==null?"—":`₱${row.cost.toLocaleString("en-PH",{minimumFractionDigits:2})}`}/>
              <Field label="Next Due" value={row.nextDueDate || "—"}/>
              <Field label="Assigned Driver" value={drivers.find((d)=>d.id===row.assignedDriverId)?.name || "—"}/>
              <div className="col-span-2"><Field label="Description" value={row.description || "—"}/></div>
            </div>
          </section>

          <section>
            <div className="text-sm font-medium mb-2">Attachments</div>
            <AttachmentsGrid files={row.attachments} onOpen={(i)=>onOpenLightbox({ files:row.attachments, index:i })}/>
          </section>

          <section>
            <div className="text-sm font-medium mb-2">Document Preview</div>
            <div className="relative w-full rounded-xl bg-white ring-1 ring-black/10 shadow overflow-hidden">
              <div className="pt-[141.1%] bg-[repeating-linear-gradient(0deg,transparent,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)]"/>
              <div className="absolute inset-0 p-3">
                {preview ? (
                  <img src={preview.url} alt={preview.name} className="w-full h-full object-contain"/>
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-neutral-500">No preview available</div>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="text-sm font-medium mb-2">History</div>
            <div className="space-y-2">
              {row.history?.slice().reverse().map((h)=>(
                <div key={`${h.at}-${h.to}`} className="text-xs text-gray-700">
                  <b>{h.from}</b> → <b>{h.to}</b> • {new Date(h.at).toLocaleString()} • {h.by}{h.note?` • ${h.note}`:""}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
