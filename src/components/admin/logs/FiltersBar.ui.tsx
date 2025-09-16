"use client";
import * as React from "react";
import { Search } from "lucide-react";
import type { LogFilters } from "@/lib/admin/logs/types";
import { LogConstants } from "@/lib/admin/logs/service";

export function LogsFiltersBar({
  value, onChange, onClear
}: {
  value: LogFilters;
  onChange: (v: LogFilters) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border">
        <Search size={16} className="opacity-60" />
        <input
          placeholder="Search actor, entity, details…"
          className="outline-none text-sm"
          value={value.search ?? ""}
          onChange={e => onChange({ ...value, search: e.target.value })}
        />
      </div>

      <select className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.actorType ?? ""} onChange={e=>onChange({ ...value, actorType: e.target.value as any })}
      >
        <option value="">All Actors</option>
        {LogConstants.actorTypes.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <select className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.entityType ?? ""} onChange={e=>onChange({ ...value, entityType: e.target.value as any })}
      >
        <option value="">All Entities</option>
        {LogConstants.entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.action ?? ""} onChange={e=>onChange({ ...value, action: e.target.value as any })}
      >
        <option value="">All Actions</option>
        {LogConstants.actions.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <select className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.severity ?? ""} onChange={e=>onChange({ ...value, severity: e.target.value as any })}
      >
        <option value="">All Severity</option>
        {LogConstants.severities.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <input type="date" className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.dateFrom ?? ""} onChange={e=>onChange({ ...value, dateFrom: e.target.value })} title="From" />
      <input type="date" className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.dateTo ?? ""} onChange={e=>onChange({ ...value, dateTo: e.target.value })} title="To" />

      <button onClick={onClear} className="ml-auto px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50">
        Clear
      </button>
    </div>
  );
}
