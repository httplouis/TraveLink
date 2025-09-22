"use client";
import * as React from "react";
import { Edit, Trash2 } from "lucide-react";
import type { Driver } from "@/lib/admin/drivers/types";
import { StatusBadge } from "@/components/common/ui/StatusBadge.ui";

export function DriversTable({
  rows,
  selection,
  setSelection,
  onEdit,
  onDelete,
}: {
  rows: Driver[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const allChecked = rows.length > 0 && selection.length === rows.length;
  const toggleAll = () => setSelection(allChecked ? [] : rows.map((r) => r.id));
  const toggleOne = (id: string) =>
    setSelection(
      selection.includes(id)
        ? selection.filter((x) => x !== id)
        : [...selection, id]
    );

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-[1000px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="w-10 p-2 text-left">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            </th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Code</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">License</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Assigned Vehicle</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selection.includes(d.id)}
                  onChange={() => toggleOne(d.id)}
                />
              </td>
              <td className="p-2 font-medium">
                {d.firstName} {d.lastName}
              </td>
              <td className="p-2">{d.code}</td>
              <td className="p-2">
                <StatusBadge value={d.status} />
              </td>
              <td className="p-2">
                {d.licenseClass} • {d.licenseNo} &nbsp;({d.licenseExpiryISO})
              </td>
              <td className="p-2">{d.phone ?? "—"}</td>
              <td className="p-2">{d.email ?? "—"}</td>
              <td className="p-2">{d.assignedVehicleId ?? "—"}</td>
              <td className="p-2">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(d.id)}
                    className="p-1.5 rounded-md border hover:bg-gray-50"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(d.id)}
                    className="p-1.5 rounded-md border hover:bg-gray-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-6 text-center text-gray-500" colSpan={9}>
                No drivers match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
