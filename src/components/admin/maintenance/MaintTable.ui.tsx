"use client";
import * as React from "react";
import { Edit, Trash2 } from "lucide-react";
import type { Maintenance } from "@/lib/admin/maintenance/types";

export function MaintTable({
  rows, selection, setSelection, onEdit, onDelete
}: {
  rows: Maintenance[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const all = rows.length > 0 && selection.length === rows.length;
  const toggleAll = () => setSelection(all ? [] : rows.map(r => r.id));
  const toggleOne = (id: string) =>
    setSelection(selection.includes(id) ? selection.filter(x => x !== id) : [...selection, id]);

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-[980px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="w-10 p-2 text-left">
              <input type="checkbox" checked={all} onChange={toggleAll} />
            </th>
            <th className="p-2 text-left">Vehicle</th>
            <th className="p-2 text-left">Plate</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-right">Odometer</th>
            <th className="p-2 text-left">Request</th>
            <th className="p-2 text-left">Service</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => (
            <tr key={m.id} className="border-top">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selection.includes(m.id)}
                  onChange={() => toggleOne(m.id)}
                />
              </td>
              <td className="p-2">{m.vehicleCode}</td>
              <td className="p-2">{m.plateNo}</td>
              <td className="p-2">{m.type}</td>
              <td className="p-2">{m.description}</td>
              <td className="p-2 text-right">{m.odometerKm.toLocaleString()} km</td>
              <td className="p-2">{m.requestDate}</td>
              <td className="p-2">{m.serviceDate ?? "-"}</td>
              <td className="p-2">
                <span className="px-2 py-0.5 rounded-full bg-gray-100">{m.status}</span>
              </td>
              <td className="p-2">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(m.id)}
                    className="p-1.5 border rounded-md hover:bg-gray-50"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(m.id)}
                    className="p-1.5 border rounded-md hover:bg-gray-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={10} className="p-6 text-center text-gray-500">
                No records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
