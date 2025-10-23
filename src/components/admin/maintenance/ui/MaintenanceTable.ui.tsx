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
    <div className="overflow-auto rounded-xl bg-white/80 backdrop-blur-sm ring-1 ring-black/5 shadow-sm">
      <table className="min-w-[880px] w-full">
        <thead className="sticky top-0 z-10 bg-gradient-to-b from-neutral-100 to-neutral-50/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/70">
          <tr className="text-left text-neutral-600 text-xs border-b border-neutral-200/70">
            <th className="px-4 py-3 w-64">Vehicle</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Attachments</th>
            <th className="px-4 py-3">Cost</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 w-28">Action</th>
          </tr>
        </thead>
        <tbody className="[&>tr:nth-child(odd)]:bg-white [&>tr:nth-child(even)]:bg-neutral-50/60">
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">No records.</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-neutral-200/60 last:border-0 hover:bg-[#7a1f2a]/5 transition">
              <td className={`px-4 ${py}`}>
                <div className="font-medium text-neutral-900">{vehName(r.vehicleId)}</div>
                <div className="text-xs text-neutral-500">{r.description || "—"}</div>
              </td>
              <td className={`px-4 ${py} text-sm`}><TypeBadge type={r.type} /></td>
              <td className={`px-4 ${py}`}><StatusSwitch value={r.status} onChange={(n)=>onStatus(r.id,n)}/></td>
              <td className={`px-4 ${py}`}>
                <AttachmentBadges files={r.attachments} onOpen={(i)=>onOpenLightbox({ files:r.attachments, index:i })}/>
              </td>
              <td className={`px-4 ${py} text-sm`}>
                {r.cost == null ? "—" : `₱${r.cost.toLocaleString("en-PH",{minimumFractionDigits:2})}`}
              </td>
              <td className={`px-4 ${py} text-sm`}>{r.createdAt}</td>
              <td className={`px-4 ${py}`}>
                <button onClick={()=>onOpen({ id:r.id, files:r.attachments, index:0 })}
                        className="px-3 py-1 text-sm rounded-lg ring-1 ring-black/10 hover:bg-neutral-100 transition">
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
