"use client";
import * as React from "react";
import type { Driver } from "@/lib/admin/drivers/types";
import { complianceInfo } from "@/lib/admin/drivers/utils";
import DriverRowActions from "./DriverRowActions.ui";

type Props = {
  rows: Driver[];
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  onEdit: (id: string) => void;
};

export default function DriversTable({
  rows,
  selected,
  onSelectedChange,
  onEdit,
}: Props) {
  const allChecked = rows.length > 0 && selected.length === rows.length;
  const toggleAll = () =>
    onSelectedChange(allChecked ? [] : rows.map((r) => r.id));
  const toggleOne = (id: string) =>
    onSelectedChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );

  return (
    <div className="overflow-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th className="p-3">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
              />
            </th>
            <th className="p-3 text-left">Driver</th>
            <th className="p-3 text-left">Employee #</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">License</th>
            <th className="p-3 text-left">Compliance</th>
            <th className="p-3 text-left">Primary Vehicle</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggleOne(r.id)}
                />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {r.firstName[0]}
                      {r.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {r.firstName} {r.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </div>
                </div>
              </td>
              <td className="p-3">{r.employeeNo}</td>
              <td className="p-3">
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    r.status === "active"
                      ? "bg-green-100 text-green-700"
                      : r.status === "suspended"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="p-3">
                {r.license.category} · {r.license.number}
                <div className="text-xs text-gray-500">
                  exp {r.license.expiry}
                </div>
              </td>
              <td className="p-3">
                {(() => {
                  const c = complianceInfo(r);
                  return (
                    <span
                      className={`rounded px-2 py-1 text-xs ${c.className}`}
                    >
                      {c.label}
                    </span>
                  );
                })()}
              </td>
              <td className="p-3">{r.primaryVehicleId ?? "—"}</td>
              <td className="p-3">
                <DriverRowActions onEdit={() => onEdit(r.id)} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-10 text-center text-gray-500">
                No drivers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
