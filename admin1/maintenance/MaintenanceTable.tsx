"use client";

import { MaintVehicle, MaintenanceTicket, ServiceState } from "@/lib/maintenanceDomain";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

const STATUS_TONE: Record<string, string> = {
  "Reported": "bg-amber-100 text-amber-700",
  "Diagnosing": "bg-blue-100 text-blue-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  "Waiting Parts": "bg-neutral-200 text-neutral-700",
  "Completed": "bg-emerald-100 text-emerald-700",
};
const SEV_TONE: Record<string, string> = {
  "Low": "bg-neutral-100 text-neutral-700",
  "Medium": "bg-amber-100 text-amber-700",
  "High": "bg-orange-100 text-orange-700",
  "Critical": "bg-rose-100 text-rose-700",
};

export default function MaintenanceTable({
  rows,
  vehicles,
  page,
  pageSize,
  onPage,
  onRow,
  onAdvance,
  onToggleOOS,
  onSetDue,
  onSetCost,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  rows: MaintenanceTicket[];
  vehicles: MaintVehicle[];
  page: number;
  pageSize: number;
  onPage: (n: number) => void;
  onRow: (row: MaintenanceTicket) => void;
  onAdvance: (id: string) => void;
  onToggleOOS: (vehicleId: string, state: ServiceState) => void;
  onSetDue: (id: string, iso?: string) => void;
  onSetCost: (id: string, cost?: number) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
}) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  const sliceIds = useMemo(() => slice.map(r => r.id), [slice]);
  const byV = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);

  const allInPageSelected = sliceIds.every(id => selectedIds.has(id));
  const someInPageSelected = sliceIds.some(id => selectedIds.has(id));
  const toggleAll = () => onToggleSelectAll(sliceIds);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allInPageSelected}
                  ref={(el) => el && (el.indeterminate = !allInPageSelected && someInPageSelected)}
                  onChange={toggleAll}
                  className="accent-[#7A0010]"
                />
              </th>
              <th className="text-left font-medium px-4 py-2.5">Opened</th>
              <th className="text-left font-medium px-4 py-2.5">Ticket</th>
              <th className="text-left font-medium px-4 py-2.5">Severity</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-left font-medium px-4 py-2.5">Vehicle</th>
              <th className="text-left font-medium px-4 py-2.5">Campus</th>
              <th className="text-left font-medium px-4 py-2.5">Service</th>
              <th className="text-left font-medium px-4 py-2.5">Due</th>
              <th className="text-right font-medium px-4 py-2.5">Cost (₱)</th>
              <th className="text-right font-medium px-4 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slice.map((r) => {
              const v = byV.get(r.vehicleId);
              return (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => onToggleSelect(r.id)}
                      className="accent-[#7A0010]"
                    />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 min-w-[280px]">
                    <button className="text-[#7A0010] hover:underline font-medium" onClick={() => onRow(r)}>{r.title}</button>
                    <div className="text-[12px] text-neutral-600 truncate">{r.description}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${SEV_TONE[r.severity]}`}>{r.severity}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_TONE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{v?.name} <span className="text-neutral-500">({v?.id})</span></div>
                    <div className="text-[12px] text-neutral-600">{v?.plate} • {v?.type}</div>
                  </td>
                  <td className="px-4 py-2.5">{r.campus}</td>
                  <td className="px-4 py-2.5">
                    <button
                      className={`text-xs px-2.5 py-1 rounded-full border ${v?.serviceState === "Out of Service" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                      onClick={() => onToggleOOS(r.vehicleId, v?.serviceState === "Out of Service" ? "In Service" : "Out of Service")}
                      title="Toggle vehicle service state"
                    >
                      {v?.serviceState}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 min-w-[160px]">
                    <input
                      type="date"
                      value={r.dueDate?.slice(0,10) ?? ""}
                      onChange={(e) => onSetDue(r.id, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      className="rounded-md border border-neutral-300 px-2 py-1 outline-none text-sm"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right min-w-[140px]">
                    <input
                      type="number"
                      min={0}
                      value={r.cost ?? ""}
                      onChange={(e) => onSetCost(r.id, e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                      className="w-[120px] rounded-md border border-neutral-300 px-2 py-1 outline-none text-sm text-right"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-white"
                      style={{ background: "#7A0010" }}
                      onClick={() => onAdvance(r.id)}
                      title="Advance status"
                    >
                      Advance →
                    </button>
                  </td>
                </tr>
              );
            })}
            {slice.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-neutral-500">No tickets match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs text-neutral-600">
          Showing <b>{slice.length}</b> of <b>{rows.length}</b> (page {page} of {pages})
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-2 rounded-md border hover:bg-neutral-50 disabled:opacity-50"
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-md border hover:bg-neutral-50 disabled:opacity-50"
            onClick={() => onPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
