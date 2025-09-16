"use client";

import { CAMPUSES, MAINT_STATUSES, SEVERITIES, VEHICLE_TYPES, MaintenanceQuery } from "@/lib/maintenanceDomain";
import { Filter, Search, Calendar } from "lucide-react";

export default function MaintenanceFilters({
  total,
  showing,
  query,
  onChange,
}: {
  total: number;
  showing: number;
  query: MaintenanceQuery;
  onChange: (q: MaintenanceQuery) => void;
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
              placeholder="Search ticket, vehicle, plate, issue…"
              className="bg-transparent outline-none text-sm w-full"
              value={query.search ?? ""}
              onChange={(e) => onChange({ ...query, search: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid xl:grid-cols-4 md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Campus</label>
          <select
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm"
            value={query.campus ?? "All"}
            onChange={(e) => onChange({ ...query, campus: e.target.value })}
          >
            {["All", ...CAMPUSES].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Vehicle type</label>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map(t => {
              const active = (query.types ?? []).includes(t);
              return (
                <button
                  key={t}
                  onClick={() => onChange({ ...query, types: toggle(query.types, t) })}
                  className={`px-2.5 py-1.5 rounded-full text-xs ring-1 transition ${
                    active ? "bg-neutral-900 text-white ring-neutral-900"
                           : "bg-white text-neutral-800 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Severity</label>
          <div className="flex flex-wrap gap-2">
            {SEVERITIES.map(s => {
              const active = (query.severities ?? []).includes(s);
              return (
                <button
                  key={s}
                  onClick={() => onChange({ ...query, severities: toggle(query.severities, s) })}
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

        <div className="grid gap-1">
          <label className="text-xs text-neutral-600">Status</label>
          <div className="flex flex-wrap gap-2">
            {MAINT_STATUSES.map(s => {
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
      </div>

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
