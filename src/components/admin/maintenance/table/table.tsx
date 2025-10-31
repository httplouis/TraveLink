"use client";

import * as React from "react";
import type { Maintenance, MaintStatus } from "@/lib/admin/maintenance/types";
import AttachmentBadges from "../ui/AttachmentBadges.ui";
import TypeBadge from "../ui/TypeBadge.tsx";
import StatusSwitch from "../ui/StatusSwitch";
import { updateMaintenance } from "@/lib/admin/maintenance/handlers";

export type MaintTableHandle = {
  focus?: () => void;
};

type Props = {
  rows: Maintenance[];
  loading?: boolean;
  onUpdated?: (m: Maintenance) => void;
  onDeleted?: (id: string) => void;
};

const COLORS: Record<MaintStatus, string> = {
  Submitted:   "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "In-Progress":"bg-amber-50 text-amber-800 ring-amber-200",
  Completed:   "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected:    "bg-rose-50 text-rose-700 ring-rose-200",
};

const MaintTable = React.forwardRef<MaintTableHandle, Props>(function MaintTable(
  { rows, loading, onUpdated, onDeleted },
  _ref
) {
  async function changeStatus(row: Maintenance, next: MaintStatus) {
    const updated = await updateMaintenance(row.id, { status: next } as Partial<Omit<Maintenance, "id" | "createdAt" | "history">>);
    if (updated) onUpdated?.(updated);
  }

  return (
    <table className="min-w-full text-sm text-neutral-800">
      <thead>
        <tr className="text-xs uppercase text-neutral-500">
          <th className="py-2 text-left w-[30%]">Vehicle</th>
          <th className="py-2 text-left">Type</th>
          <th className="py-2 text-left">Status</th>
          <th className="py-2 text-left">Attachments</th>
          <th className="py-2 text-right">Cost</th>
          <th className="py-2 text-left">Date</th>
          <th className="py-2 text-left">Next Due</th>
          <th className="py-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-neutral-50/40">
            <td className="py-4 pr-3">
              <div className="font-medium leading-6">{r.vehicle}</div>
              <div className="text-xs text-neutral-500">{r.vendor}</div>
            </td>

            <td className="py-4">
              <TypeBadge value={r.type} />
            </td>

            <td className="py-4">
              <StatusSwitch
                row={r}
                onChanged={(m) => onUpdated?.(m)}
              />
            </td>

            <td className="py-4">
              <AttachmentBadges items={r.attachments} />
            </td>

            <td className="py-4 text-right">
              {typeof r.costPhp === "number"
                ? r.costPhp.toLocaleString("en-PH", { style: "currency", currency: "PHP" })
                : "—"}
            </td>

            <td className="py-4">
              {r.date ? new Date(r.date).toLocaleDateString() : "—"}
            </td>

            <td className="py-4">
              {r.nextDueDateISO ? new Date(r.nextDueDateISO).toLocaleDateString() : "—"}
            </td>

            <td className="py-4 text-right">
              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => onUpdated?.(r)}
                  className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50"
                >
                  View
                </button>
                <button
                  onClick={() => onDeleted?.(r.id)}
                  className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-inset ring-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
        {!rows.length && !loading && (
          <tr>
            <td colSpan={8} className="py-10 text-center text-neutral-500">
              No maintenance records.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
});

export default MaintTable;
