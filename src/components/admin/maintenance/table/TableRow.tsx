"use client";
import * as React from "react";
import type { Maintenance } from "@/lib/admin/maintenance/types";
import { Pencil, Trash2 } from "lucide-react";
import StatusChip from "@/components/common/ui/StatusChip.ui";

const php = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

function pick(r: Maintenance, ...keys: string[]) {
  for (const k of keys) {
    const v = (r as any)[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
}
const getCost = (r: Maintenance) => {
  const v = pick(r, "cost", "amount", "totalCost", "price") as any;
  const n = Number(v); return Number.isFinite(n) ? n : 0;
};

export default function TableRow({
  row, checked, onToggle, onEdit, onDelete
}: {
  row: Maintenance;
  checked: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = String(pick(row, "status", "state") || "");

  return (
    <tr className="border-t even:bg-gray-50/40 hover:bg-gray-50 transition-colors">
      <td className="p-2">
        <input type="checkbox" checked={checked} onChange={onToggle} aria-label="Select row" />
      </td>
      <td className="p-2">{pick(row, "vehicleCode", "vehicle", "unit")}</td>
      <td className="p-2">{pick(row, "plateNo", "plate", "plateNumber")}</td>
      <td className="p-2">{pick(row, "type", "category", "kind")}</td>
      <td className="p-2"><StatusChip status={status} /></td>
      <td className="p-2">{php.format(getCost(row))}</td>
      <td className="p-2">{pick(row, "date", "serviceDate", "performedAt", "updatedAt", "createdAt")}</td>
      <td className="p-2 text-right">
        <div className="inline-flex gap-1">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 bg-white hover:bg-gray-50"
            aria-label="Edit"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 bg-white text-rose-700 hover:bg-rose-50"
            aria-label="Delete"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
