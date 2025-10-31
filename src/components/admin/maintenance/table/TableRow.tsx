"use client";

import * as React from "react";
import type {
  Maintenance,
  MaintAttachment,
} from "@/lib/admin/maintenance/types";
import StatusSwitch from "@/components/admin/maintenance/ui/StatusSwitch";

type Props = {
  r: Maintenance;
  onView?: (row: Maintenance) => void;
  onEdit?: (row: Maintenance) => void;
  onDelete?: (row: Maintenance) => void;
  onChangeStatus2?: (row: Maintenance) => void; // keep your existing callback name
};

/* attachment badge kept simple (IMG / PDF) per your request */
function AttachmentBadge({ a }: { a: MaintAttachment }) {
  const tag = a.kind === "img" ? "IMG" : "PDF";
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-neutral-300 mr-1"
      title={a.name}
    >
      {tag}
    </a>
  );
}

export default function TableRow({ r, onView, onEdit, onDelete, onChangeStatus2 }: Props) {
  /* when status changes inside StatusSwitch, bubble the updated row up */
  const handleStatusChanged = (updated: Maintenance) => {
    onChangeStatus2?.(updated);
  };

  return (
    <tr className="border-b last:border-b-0">
      {/* Vehicle */}
      <td className="px-3 py-2 text-sm text-neutral-800">
        {r.vehicle}
      </td>

      {/* Type */}
      <td className="px-3 py-2 text-sm text-neutral-700">
        {r.type}
      </td>

      {/* Status — colored pill, clickable */}
      <td className="px-3 py-2">
        <StatusSwitch row={r} onChanged={handleStatusChanged} />
      </td>

      {/* Date */}
      <td className="px-3 py-2 text-sm text-neutral-700">
        {r.date?.slice(0, 10) ?? ""}
      </td>

      {/* Next Due (kept simple; you already style elsewhere) */}
      <td className="px-3 py-2 text-sm text-neutral-700">
        {r.nextDueDateISO?.slice(0, 10) ?? (r.nextDueOdometer ? `${r.nextDueOdometer} km` : "—")}
      </td>

      {/* Attachments — show IMG / PDF badges (clickable) */}
      <td className="px-3 py-2">
        {(r.attachments?.length ?? 0) > 0 ? (
          <div className="flex flex-wrap">
            {r.attachments!.map((a) => (
              <AttachmentBadge key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <div className="text-xs text-neutral-400">No preview available</div>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView?.(r)}
            className="text-xs px-2 h-7 rounded-md border border-neutral-300 hover:bg-neutral-50"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(r)}
            className="text-xs px-2 h-7 rounded-md border border-neutral-300 hover:bg-neutral-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(r)}
            className="text-xs px-2 h-7 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
