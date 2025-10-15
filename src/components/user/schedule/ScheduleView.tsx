"use client";

import Link from "next/link";
import { PageHeader, PageBody } from "@/components/common/Page";
import type { Trip, Vehicle, Status } from "@/components/user/schedule/types";

export type Filters = {
  q: string;
  veh: "" | Vehicle;
  stat: "" | Status;
  from: string; // yyyy-mm-dd
  to: string;   // yyyy-mm-dd
};

type Props = {
  tab: "upcoming" | "history";
  onTabChange: (t: "upcoming" | "history") => void;

  filters: Filters;
  onFiltersChange: (patch: Partial<Filters>) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;

  trips: Trip[]; // already filtered & sorted from container
};

const badge = (s: Status) =>
  s === "Approved" || s === "Assigned"
    ? "bg-green-100 text-green-700"
    : s === "Pending"
    ? "bg-amber-100 text-amber-700"
    : s === "Completed"
    ? "bg-neutral-200 text-neutral-700"
    : "bg-rose-100 text-rose-700";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ScheduleView({
  tab,
  onTabChange,
  filters,
  onFiltersChange,
  onResetFilters,
  onExportCsv,
  trips,
}: Props) {
  return (
    <>
      <PageHeader
        title="Schedule"
        description="Your upcoming and past trips."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTabChange("upcoming")}
              className={`px-3 py-2 text-sm rounded-md border ${
                tab === "upcoming" ? "bg-[#7a0019] text-white border-[#7a0019]" : "hover:bg-neutral-50"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => onTabChange("history")}
              className={`px-3 py-2 text-sm rounded-md border ${
                tab === "history" ? "bg-[#7a0019] text-white border-[#7a0019]" : "hover:bg-neutral-50"
              }`}
            >
              History
            </button>
            <Link href="/faculty/request" className="rounded-md bg-[#7a0019] text-white px-3 py-2 text-sm">
              New Request
            </Link>
          </div>
        }
      />

      <PageBody>
        {/* Filters */}
        <div className="rounded-lg border bg-white p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2">
              <input
                value={filters.q}
                onChange={(e) => onFiltersChange({ q: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="Search destination, ID, vehicle…"
              />
            </div>
            <div>
              <select
                value={filters.veh}
                onChange={(e) => onFiltersChange({ veh: e.target.value as Filters["veh"] })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All vehicles</option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
                <option value="Bus">Bus</option>
              </select>
            </div>
            <div>
              <select
                value={filters.stat}
                onChange={(e) => onFiltersChange({ stat: e.target.value as Filters["stat"] })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Assigned">Assigned</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => onFiltersChange({ from: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => onFiltersChange({ to: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="text-neutral-600">
              Showing <span className="font-medium">{trips.length}</span> result{trips.length !== 1 ? "s" : ""}
            </div>
            <div className="flex gap-2">
              <button onClick={onExportCsv} className="rounded-md border px-3 py-1.5 hover:bg-neutral-50">
                Export CSV
              </button>
              <button onClick={onResetFilters} className="rounded-md border px-3 py-1.5 hover:bg-neutral-50">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results: mobile cards */}
        <div className="md:hidden grid gap-3 mt-4">
          {trips.map((t) => (
            <div key={t.id} className="rounded-lg border bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.destination}</div>
                <span className={`text-xs px-2 py-1 rounded ${badge(t.status)}`}>{t.status}</span>
              </div>
              <div className="mt-1 text-sm text-neutral-600">{t.vehicle}</div>
              <div className="mt-1 text-sm text-neutral-600">
                {fmtDate(t.start)} → {fmtDate(t.end)}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/faculty/request`} className="text-xs border rounded px-2 py-1 hover:bg-neutral-50">
                  Details
                </Link>
              </div>
            </div>
          ))}
          {trips.length === 0 && (
            <div className="rounded-lg border bg-white p-4 text-sm text-neutral-600">No results.</div>
          )}
        </div>

        {/* Results: desktop table */}
        <div className="hidden md:block mt-4 overflow-x-auto">
          <table className="min-w-full text-sm bg-white border rounded-lg overflow-hidden">
            <thead className="bg-neutral-50">
              <tr className="text-neutral-700">
                <th className="text-left font-medium px-4 py-2">ID</th>
                <th className="text-left font-medium px-4 py-2">Start</th>
                <th className="text-left font-medium px-4 py-2">End</th>
                <th className="text-left font-medium px-4 py-2">Vehicle</th>
                <th className="text-left font-medium px-4 py-2">Destination</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-left font-medium px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trips.map((t) => (
                <tr key={t.id} className="bg-white">
                  <td className="px-4 py-2">{t.id}</td>
                  <td className="px-4 py-2">{fmtDate(t.start)}</td>
                  <td className="px-4 py-2">{fmtDate(t.end)}</td>
                  <td className="px-4 py-2">{t.vehicle}</td>
                  <td className="px-4 py-2">{t.destination}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-1 rounded ${badge(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/faculty/request`} className="text-xs border rounded px-2 py-1 hover:bg-neutral-50">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageBody>
    </>
  );
}
