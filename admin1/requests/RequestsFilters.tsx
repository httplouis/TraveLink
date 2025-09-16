"use client";

import { RequestsQuery, REQUEST_STATUSES } from "@/lib/requests";
import { Filter, Search, Calendar, AlertTriangle } from "lucide-react";

const CAMPUSES = ["All", "Lucena", "Candelaria", "Saman"];

export default function RequestsFilters({
  query,
  onChange,
  total,
  showing,
}: {
  query: RequestsQuery;
  onChange: (q: RequestsQuery) => void;
  total: number;
  showing: number;
}) {
  const toggle = <T extends string>(arr: T[] | undefined, v: T): T[] =>
    (arr ?? []).includes(v) ? (arr ?? []).filter(x => x !== v) : [ ...(arr ?? []), v ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="font-medium">Filters</span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-600">{showing} shown</span>
          <span className="text-neutral-400">/ {total} total</span>
        </div>

        <div className="flex items-center gap-2 w-full max-w-[520px]">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 w-full">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              placeholder="Search ID, requester, purpose…"
              className="bg-transparent outline-none text-sm w-full"
              value={query.search ?? ""}
              onChange={(e) => onChange({ ...query, search: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="mt-3 grid lg:grid-cols-4 md:grid-cols-2 gap-3">
        {/* status */}
        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Status</label>
          <div className="flex flex-wrap gap-2">
            {REQUEST_STATUSES.map(s => {
              const active = (query.statuses ?? []).includes(s);
              return (
                <button
                  key={s}
                  onClick={() => onChange({ ...query, statuses: toggle(query.statuses, s) })}
                  className={`px-2.5 py-1.5 rounded-full text-xs ring-1 transition ${
                    active ? "bg-neutral-900 text-white ring-neutral-900"
                           : "bg-white text-neutral-800 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* campus */}
        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Campus</label>
          <select
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm"
            value={query.campus ?? "All"}
            onChange={(e) => onChange({ ...query, campus: e.target.value })}
          >
            {CAMPUSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* date from */}
        <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <input
            type="date"
            className="bg-transparent outline-none text-sm w-full"
            value={query.from?.slice(0,10) ?? ""}
            onChange={(e) => onChange({ ...query, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
        </div>

        {/* date to + urgent */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 w-full">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              className="bg-transparent outline-none text-sm w-full"
              value={query.to?.slice(0,10) ?? ""}
              onChange={(e) => onChange({ ...query, to: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...query, urgentOnly: !query.urgentOnly })}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm ${
              query.urgentOnly ? "border-red-400 bg-red-50 text-red-700" : "border-neutral-300 bg-white text-neutral-700"
            }`}
            title="Urgent only"
          >
            <AlertTriangle className="w-4 h-4" />
            Urgent
          </button>
        </div>
      </div>
    </div>
  );
}
