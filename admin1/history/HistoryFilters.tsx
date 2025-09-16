// src/components/admin/history/HistoryFilters.tsx
"use client";

import { useMemo } from "react";
import { Calendar, Filter, Search, X } from "lucide-react";
import { HISTORY_STATUSES, HISTORY_TYPES, HistoryQuery, HistoryStatus, HistoryType } from "@/lib/history";

type Props = {
  query: HistoryQuery;
  onChange: (next: HistoryQuery) => void;
  total: number;
  showing: number;
};

export default function HistoryFilters({ query, onChange, total, showing }: Props) {
  const activeCount = useMemo(() => {
    let n = 0;
    if (query.search) n++;
    if (query.from || query.to) n++;
    if (query.types?.length) n++;
    if (query.statuses?.length) n++;
    return n;
  }, [query]);

  const toggle = <T extends string>(arr: T[] | undefined, value: T): T[] =>
    (arr ?? []).includes(value) ? (arr ?? []).filter(v => v !== value) : [ ...(arr ?? []), value ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="font-medium">Filters</span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-600">{showing} shown</span>
          <span className="text-neutral-400">/ {total} total</span>
          {activeCount > 0 && (
            <button
              className="ml-2 text-xs text-[#7A0010] hover:underline"
              onClick={() => onChange({})}
              title="Clear filters"
            >
              Clear ({activeCount})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full max-w-[460px]">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 w-full">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              placeholder="Search title, actor, ref id…"
              className="bg-transparent outline-none text-sm w-full"
              value={query.search ?? ""}
              onChange={(e) => onChange({ ...query, search: e.target.value })}
            />
            {!!query.search && (
              <button className="p-1 rounded hover:bg-neutral-50" onClick={() => onChange({ ...query, search: "" })}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Type */}
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Type</label>
          <div className="flex flex-wrap gap-2">
            {HISTORY_TYPES.map((t) => {
              const active = (query.types ?? []).includes(t);
              return (
                <button
                  key={t}
                  onClick={() => onChange({ ...query, types: toggle<HistoryType>(query.types, t) })}
                  className={`px-2.5 py-1.5 rounded-full text-xs ring-1 transition ${
                    active
                      ? "bg-neutral-900 text-white ring-neutral-900"
                      : "bg-white text-neutral-800 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Status</label>
          <div className="flex flex-wrap gap-2">
            {HISTORY_STATUSES.map((s) => {
              const active = (query.statuses ?? []).includes(s);
              return (
                <button
                  key={s}
                  onClick={() => onChange({ ...query, statuses: toggle<HistoryStatus>(query.statuses, s) })}
                  className={`px-2.5 py-1.5 rounded-full text-xs ring-1 transition ${
                    active
                      ? "bg-neutral-900 text-white ring-neutral-900"
                      : "bg-white text-neutral-800 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <input
            type="date"
            className="bg-transparent outline-none text-sm w-full"
            value={query.from?.slice(0,10) ?? ""}
            onChange={(e) => onChange({ ...query, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <input
            type="date"
            className="bg-transparent outline-none text-sm w-full"
            value={query.to?.slice(0,10) ?? ""}
            onChange={(e) => onChange({ ...query, to: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
        </div>
      </div>
    </div>
  );
}
