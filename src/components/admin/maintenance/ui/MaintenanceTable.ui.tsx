"use client";
import * as React from "react";
import type { Attachment, MaintRecord, MaintStatus, Vehicle } from "@/lib/admin/maintenance";
import TypeBadge from "./TypeBadge";
import AttachmentBadges from "./AttachmentBadges.ui";
import StatusSwitch from "./StatusSwitch";

type Props = {
  rows: MaintRecord[];
  vehicles: Vehicle[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  density: "comfortable" | "compact";
  onStatus: (id: string, next: MaintStatus) => void;
  onOpen: (args: { id: string; files: Attachment[]; index: number }) => void;
  onOpenLightbox: (args: { files: Attachment[]; index: number }) => void;
};

export default function MaintenanceTable({
  rows, vehicles, density, onOpen, onOpenLightbox, onStatus,
}: Props) {
  const py = density === "compact" ? "py-2" : "py-3";
  const vehName = (id: string) => vehicles.find((v) => v.id === id)?.name || id;

  return (
    <div className="overflow-auto rounded-xl bg-white shadow-lg ring-1 ring-black/5">
      <table className="min-w-[880px] w-full">
        <thead className="sticky top-0 z-10 bg-gradient-to-b from-[#7a1f2a] to-[#8a2f3a] text-white">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide">
            <th className="px-6 py-4 w-64">Vehicle</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Attachments</th>
            <th className="px-6 py-4">Cost</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4 w-28">Action</th>
          </tr>
        </thead>
        <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-neutral-50/50">
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl">🔧</div>
                  <div className="text-sm font-medium text-neutral-500">No maintenance records found</div>
                  <div className="text-xs text-neutral-400">Create a new maintenance record to get started</div>
                </div>
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-neutral-200/60 last:border-0 hover:bg-[#7a1f2a]/5 transition-colors">
              <td className={`px-6 ${py}`}>
                <div className="font-semibold text-neutral-900">{vehName(r.vehicleId)}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{r.description || "—"}</div>
              </td>
              <td className={`px-6 ${py} text-sm`}><TypeBadge type={r.type} /></td>
              <td className={`px-6 ${py}`}><StatusSwitch value={r.status} onChange={(n)=>onStatus(r.id,n)}/></td>
              <td className={`px-6 ${py}`}>
                <AttachmentBadges files={r.attachments} onOpen={(i)=>onOpenLightbox({ files:r.attachments, index:i })}/>
              </td>
              <td className={`px-6 ${py} text-sm font-medium`}>
                {r.cost == null ? <span className="text-neutral-400">—</span> : <span className="text-emerald-600">₱{r.cost.toLocaleString("en-PH",{minimumFractionDigits:2})}</span>}
              </td>
              <td className={`px-6 ${py} text-sm text-neutral-600`}>{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td className={`px-6 ${py}`}>
                <button onClick={()=>onOpen({ id:r.id, files:r.attachments, index:0 })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[#7a1f2a]/10 text-[#7a1f2a] hover:bg-[#7a1f2a]/20 transition-colors font-medium">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
