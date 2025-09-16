"use client";

import { RequestItem } from "@/lib/requests";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const STATUS_TONE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
};

export default function RequestsTable({
  rows,
  page,
  pageSize,
  onPage,
  onSelectRow,
  onApprove,
  onReject,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  rows: RequestItem[];
  page: number;
  pageSize: number;
  onPage: (n: number) => void;
  onSelectRow: (row: RequestItem) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
}) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  const sliceIds = useMemo(() => slice.map(r => r.id), [slice]);

  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const allInPageSelected = sliceIds.every(id => selectedIds.has(id));
  const someInPageSelected = sliceIds.some(id => selectedIds.has(id));

  const toggleAll = () => onToggleSelectAll(sliceIds);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] text-sm">
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
              <th className="text-left font-medium px-4 py-2.5">Created</th>
              <th className="text-left font-medium px-4 py-2.5">Needed On</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-left font-medium px-4 py-2.5">Requester</th>
              <th className="text-left font-medium px-4 py-2.5">Campus / Dept</th>
              <th className="text-left font-medium px-4 py-2.5">Route</th>
              <th className="text-right font-medium px-4 py-2.5">Passengers</th>
              <th className="text-left font-medium px-4 py-2.5">Notes</th>
              <th className="text-right font-medium px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slice.map((r) => (
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
                <td className="px-4 py-2.5 whitespace-nowrap">{new Date(r.neededOn).toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_TONE[r.status]}`}>{r.status}</span>
                  {r.priority === "Urgent" && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Urgent</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onSelectRow(r)}
                    className="text-[#7A0010] hover:underline"
                    title="View details"
                  >
                    {r.requester}
                  </button>
                </td>
                <td className="px-4 py-2.5">{r.campus} • {r.department}</td>
                <td className="px-4 py-2.5 min-w-[240px]">{r.origin} → {r.destination}</td>
                <td className="px-4 py-2.5 text-right">{r.passengers}</td>
                <td className="px-4 py-2.5">
                  <input
                    value={noteById[r.id] ?? ""}
                    onChange={(e) => setNoteById((m) => ({ ...m, [r.id]: e.target.value }))}
                    placeholder="Optional note…"
                    className="w-full rounded-md border border-neutral-300 px-2 py-1 outline-none"
                  />
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <button
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 mr-2 disabled:opacity-50"
                    onClick={() => onApprove(r.id)}
                    disabled={r.status !== "Pending"}
                    title="Approve"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                    onClick={() => onReject(r.id)}
                    disabled={r.status !== "Pending"}
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-neutral-500">No requests match your filters.</td>
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
