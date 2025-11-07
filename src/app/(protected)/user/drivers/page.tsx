// src/app/(protected)/user/drivers/page.tsx
"use client";

import * as React from "react";
import { DriversRepo } from "@/lib/admin/drivers/store";

// If you have exported types, you can import them instead of re-declaring:
// import type { DriverStatus, LicenseClass } from "@/lib/admin/drivers/types";
type DriverStatus = "active" | "on_trip" | "off_duty" | "suspended";
type LicenseClass = "A" | "B" | "C" | "D" | "E";

export default function UserDriversPage() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"" | DriverStatus>("");
  const [license, setLicense] = React.useState<"" | LicenseClass>("");

  const [rows, setRows] = React.useState(() => DriversRepo.listLocal({}));

  // initial load
  React.useEffect(() => {
    DriversRepo.hydrateFromStorage();
    setRows(DriversRepo.listLocal({}));
  }, []);

  // apply filters — map "" -> undefined so types match the repo input
  React.useEffect(() => {
    setRows(
      DriversRepo.listLocal({
        search: q || undefined,
        status: (status || undefined) as DriverStatus | undefined,
        licenseClass: (license || undefined) as LicenseClass | undefined,
      }),
    );
  }, [q, status, license]);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Drivers</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, code, license no…"
            className="h-9 w-64 rounded-lg border border-neutral-300 px-3 text-sm outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | DriverStatus)}
            className="h-9 rounded-lg border border-neutral-300 px-2 text-sm"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="on_trip">On trip</option>
            <option value="off_duty">Off duty</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value as "" | LicenseClass)}
            className="h-9 rounded-lg border border-neutral-300 px-2 text-sm"
          >
            <option value="">All license</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
            <option>E</option>
          </select>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-700">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">License</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-3 py-2">
                  {d.firstName} {d.lastName}
                </td>
                <td className="px-3 py-2">{d.code}</td>
                <td className="px-3 py-2">
                  {d.licenseClass} — {d.licenseNo}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs
                      ${
                        d.status === "active"
                          ? "bg-green-100 text-green-700"
                          : d.status === "on_trip"
                          ? "bg-amber-100 text-amber-700"
                          : d.status === "off_duty"
                          ? "bg-neutral-200 text-neutral-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2">{d.phone ?? "—"}</td>
                <td className="px-3 py-2">{d.email ?? "—"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-neutral-500"
                >
                  No drivers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
