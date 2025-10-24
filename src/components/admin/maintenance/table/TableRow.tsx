"use client";
import * as React from "react";
import type { Maintenance, MaintStatus } from "@/lib/admin/maintenance/types";
import AttachmentBadges from "../ui/AttachmentBadges.ui";
import StatusBadge from "../ui/StatusBadge";
import TypeBadge from "../ui/TypeBadge";
import StatusSwitch from "../ui/StatusSwitch";

function peso(v?: number | null) {
  if (v == null) return "—";
  return `PHP ${new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)}`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

type Props = {
  r: Maintenance;
  checked: boolean;
  onCheck: (id: string, checked: boolean) => void;
  onChangeStatus: (id: string, s: MaintStatus) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TableRow({
  r,
  checked,
  onCheck,
  onChangeStatus,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const dueTone =
    r.nextDueTint === "overdue"
      ? "bg-rose-100 text-rose-800"
      : r.nextDueTint === "soon"
      ? "bg-amber-100 text-amber-800"
      : r.nextDueTint === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-neutral-100 text-neutral-700";

  const nextDueStr =
    r.nextDueDateISO
      ? fmtDate(r.nextDueDateISO)
      : r.nextDueOdometer
      ? `${r.nextDueOdometer.toLocaleString()} km`
      : "—";

  return (
    <tr className="even:bg-white odd:bg-neutral-50 hover:bg-neutral-100 transition-colors">
      <td className="px-4 py-3 w-[34px]">
        <input
          type="checkbox"
          checked={checked}
          className="accent-[#7a1f2a]"
          onChange={(e) => onCheck(r.id, e.target.checked)}
        />
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-neutral-900">{r.vehicle}</div>
        {r.vendor && <div className="text-xs text-neutral-500">{r.vendor}</div>}
      </td>

      <td className="px-4 py-3 hidden sm:table-cell">
        <TypeBadge value={r.type} />
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge value={r.status} />
          <StatusSwitch value={r.status} onChange={(s) => onChangeStatus(r.id, s)} />
        </div>
      </td>

      <td className="px-4 py-3 hidden md:table-cell">
        <AttachmentBadges items={r.attachments ?? []} />
      </td>

      <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">
        {peso(r.costPhp ?? undefined)}
      </td>

      <td className="px-4 py-3 hidden sm:table-cell">
        {fmtDate(r.date ?? undefined)}
      </td>

      <td className="px-4 py-3">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-medium",
            dueTone,
          ].join(" ")}
        >
          {nextDueStr}
          {r.nextDueTint === "overdue" && <span className="ml-1">⟶ urgent</span>}
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onView(r.id); }}
            className="px-2 py-1 text-xs rounded-md border border-neutral-300 hover:bg-neutral-100"
          >
            View
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(r.id); }}
            className="px-2 py-1 text-xs rounded-md border border-neutral-300 hover:bg-neutral-100"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
            className="px-2 py-1 text-xs rounded-md border border-rose-300 text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
