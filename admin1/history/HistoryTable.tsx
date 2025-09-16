// src/components/admin/history/HistoryTable.tsx
"use client";

import { HistoryItem } from "@/lib/history";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const STATUS_TONE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
  Completed: "bg-blue-100 text-blue-700",
  Cancelled: "bg-neutral-200 text-neutral-700",
  Info: "bg-neutral-100 text-neutral-700",
};

export default function HistoryTable({
  rows,
  page,
  pageSize,
  onPage,
  onSelectRow,
}: {
  rows: HistoryItem[];
  page: number;
  pageSize: number;
  onPage: (n: number) => void;
  onSelectRow: (row: HistoryItem) => void;
}) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">When</th>
              <th className="text-left font-medium px-4 py-2.5">Type</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-left font-medium px-4 py-2.5">Title</th>
              <th className="text-left font-medium px-4 py-2.5">Actor</th>
              <th className="text-left font-medium px-4 py-2.5">Ref</th>
              <th className="text-right font-medium px-4 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slice.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2.5 whitespace-nowrap">{formatWhen(r.ts)}</td>
                <td className="px-4 py-2.5">{r.type}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_TONE[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-2.5 min-w-[280px]">{r.title}</td>
                <td className="px-4 py-2.5">{r.actor}</td>
                <td className="px-4 py-2.5">{r.ref ? `${r.ref.kind.toUpperCase()} • ${r.ref.id}` : "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    className="inline-flex items-center gap-1 text-[#7A0010] hover:underline"
                    onClick={() => onSelectRow(r)}
                    title="View details"
                  >
                    View <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {slice.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  No history for current filters.
                </td>
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

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}
