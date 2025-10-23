"use client";

import * as React from "react";
import type { Attachment, MaintRecord } from "@/lib/admin/maintenance/maintenance.types";
import AttachmentsGrid from "./AttachmentsGrid.ui";

type Props = {
  open: boolean;
  row: MaintRecord | null;
  vehicles: { id: string; plate?: string; name?: string }[];
  drivers: { id: string; name: string }[];
  onClose: () => void;
  onStatus: (next: MaintRecord["status"], note?: string) => void;
  onOpenLightbox: (args: { files: Attachment[]; index: number }) => void;
};

export default function MaintenanceDrawer({
  open,
  row,
  vehicles,
  drivers,
  onClose,
  onStatus,
  onOpenLightbox,
}: Props) {
  const [local, setLocal] = React.useState<MaintRecord | null>(row ?? null);
  React.useEffect(() => setLocal(row ?? null), [row]);

  if (!open || !local) return null;

  const v2 = vehicles.find((x) => x.id === local.vehicleId);

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-[520px] overflow-y-auto rounded-l-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-base font-semibold">Maintenance <span className="text-neutral-500">{v2?.plate ?? ""}</span></div>
          <button className="rounded border px-3 py-1 text-sm hover:bg-neutral-50" onClick={onClose}>Close</button>
        </div>

        {/* Next due (optional) */}
        <div className="mb-3 text-xs text-neutral-500">Next Due (if applicable)</div>
        <input
          type="date"
          className="mb-4 w-full rounded-lg border px-2 py-1.5 text-sm"
          value={local.nextDueDate ?? ""}
          onChange={(e) => setLocal((r) => (r ? { ...r, nextDueDate: e.target.value || undefined } : r))}
        />

        {/* Attachments */}
        <div className="mt-4 text-xs text-neutral-500">Attachments</div>
        <AttachmentsGrid
          files={local.attachments}
          onOpen={(index) => onOpenLightbox({ files: local.attachments, index })}
        />

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="rounded bg-neutral-100 px-3 py-2 text-xs" onClick={() => onStatus("Acknowledged")}>Acknowledge</button>
          <button className="rounded bg-neutral-100 px-3 py-2 text-xs" onClick={() => onStatus("In-Progress")}>Set In-Progress</button>
          <button className="rounded bg-emerald-600 px-3 py-2 text-xs text-white" onClick={() => onStatus("Completed")}>Mark Completed</button>
          <button className="rounded bg-rose-600 px-3 py-2 text-xs text-white" onClick={() => onStatus("Rejected")}>Reject</button>
        </div>
      </div>
    </div>
  );
}
