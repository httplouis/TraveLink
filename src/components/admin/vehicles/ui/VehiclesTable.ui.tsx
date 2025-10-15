"use client";
import * as React from "react";
import { Edit, Trash2 } from "lucide-react";
import type { Vehicle } from "@/lib/admin/vehicles/types";
import { StatusBadge } from "@/components/common/ui/StatusBadge.ui";

export function VehiclesTable({
  rows,
  selection,
  setSelection,
  onEdit,
  onDelete,
}: {
  rows: Vehicle[];
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
      <table className="min-w-[800px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="w-10 p-2 text-left">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            </th>
            <th className="p-2 text-left">Plate</th>
            <th className="p-2 text-left">Code</th>
            <th className="p-2 text-left">Brand / Model</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-right">Capacity</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-right">Odometer</th>
            <th className="p-2 text-left">Last Service</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selection.includes(v.id)}
                  onChange={() => toggleOne(v.id)}
                />
              </td>
              <td className="p-2 font-medium">{v.plateNo}</td>
              <td className="p-2">{v.code}</td>
              <td className="p-2">
                {v.brand} <span className="text-gray-500">/ {v.model}</span>
              </td>
              <td className="p-2">{v.type}</td>
              <td className="p-2 text-right">{v.capacity}</td>
              <td className="p-2">
                <StatusBadge value={v.status} />
              </td>
              <td className="p-2 text-right">
                {v.odometerKm.toLocaleString()} km
              </td>
              <td className="p-2">{v.lastServiceISO}</td>
              <td className="p-2">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(v.id)}
                    className="p-1.5 rounded-md border hover:bg-gray-50"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(v.id)}
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
              <td className="p-6 text-center text-gray-500" colSpan={10}>
                No vehicles match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
