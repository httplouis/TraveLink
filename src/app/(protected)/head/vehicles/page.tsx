"use client";

import * as React from "react";
import { VehiclesRepo } from "@/lib/admin/vehicles/store";

export default function HeadVehiclesPage() {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<"" | "Bus" | "Van" | "Car" | "SUV" | "Motorcycle">("");
  const [status, setStatus] = React.useState<"" | "active" | "maintenance" | "inactive">("");
  const [rows, setRows] = React.useState(() => VehiclesRepo.listLocal({}));

  React.useEffect(() => {
    // hydrate localStorage -> memory then refresh list
    VehiclesRepo.hydrateFromStorage();
    setRows(VehiclesRepo.listLocal({}));
  }, []);

  React.useEffect(() => {
    setRows(VehiclesRepo.listLocal({ search: q, type, status }));
  }, [q, type, status]);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Vehicles</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plate, code, brand, model…"
            className="h-9 w-64 rounded-lg border border-neutral-300 px-3 text-sm outline-none"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="h-9 rounded-lg border border-neutral-300 px-2 text-sm"
          >
            <option value="">All types</option>
            <option>Bus</option><option>Van</option><option>Car</option><option>SUV</option><option>Motorcycle</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-9 rounded-lg border border-neutral-300 px-2 text-sm"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-700">
            <tr>
              <th className="px-3 py-2 text-left">Plate No.</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Brand/Model</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Capacity</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last service</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-3 py-2">{v.plateNo}</td>
                <td className="px-3 py-2">{v.code}</td>
                <td className="px-3 py-2">{v.brand} {v.model}</td>
                <td className="px-3 py-2">{v.type}</td>
                <td className="px-3 py-2">{v.capacity}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs
                    ${v.status === "active" ? "bg-green-100 text-green-700" :
                      v.status === "maintenance" ? "bg-amber-100 text-amber-700" :
                      "bg-neutral-200 text-neutral-700"}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-3 py-2">{v.lastServiceISO}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-neutral-500">No vehicles found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
