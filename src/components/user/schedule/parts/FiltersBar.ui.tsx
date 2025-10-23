// src/components/user/schedule/parts/FiltersBar.ui.tsx
"use client";

import * as React from "react";
import type { UserCalFilters } from "@/lib/user/schedule/types";

type Props = {
  value: UserCalFilters;
  onChange: (patch: Partial<UserCalFilters>) => void;
};

export function FiltersBar({ value, onChange }: Props) {
  const inputCls =
    "h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm shadow-sm shadow-black/5 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-200";
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-white/60 backdrop-blur">
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-600">Status</label>
        <select
          className={inputCls}
          value={value.status}
          onChange={(e) => onChange({ status: e.target.value as UserCalFilters["status"] })}
        >
          <option>All</option>
          <option>Available</option>
          <option>Partial</option>
          <option>Full</option>
        </select>

        <label className="ml-3 text-xs text-neutral-600">Vehicle</label>
        <select
          className={inputCls}
          value={value.vehicle}
          onChange={(e) => onChange({ vehicle: e.target.value as UserCalFilters["vehicle"] })}
        >
          <option>All</option>
          <option>Bus</option>
          <option>Van</option>
          <option>Car</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={value.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search destination / dept / driver / ID"
          className={`${inputCls} w-full sm:w-[360px] placeholder:text-neutral-400`}
        />
        <input
          type="date"
          value={value.jumpTo ?? ""}
          onChange={(e) => onChange({ jumpTo: e.target.value || null })}
          className={inputCls}
          title="Jump to date"
        />
      </div>
    </div>
  );
}
