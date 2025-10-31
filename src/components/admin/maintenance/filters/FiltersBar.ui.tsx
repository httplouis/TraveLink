"use client";

import * as React from "react";
import type { MaintFilters, MaintType, MaintStatus, NextDueTint } from "@/lib/admin/maintenance/types";

type Props = {
  value: MaintFilters;
  onChange: (v: MaintFilters) => void;
  onClear?: () => void;
};

const TYPES: readonly ("all" | MaintType)[] = [
  "all", "PMS", "Repair", "LTORenewal", "InsuranceRenewal", "Vulcanize", "Other",
] as const;

const STATUSES: readonly ("all" | MaintStatus)[] = [
  "all", "Submitted", "In-Progress", "Completed", "Rejected",
] as const;

const DUE: readonly ("all" | NextDueTint)[] = ["all", "ok", "soon", "overdue", "none"] as const;

export function MaintFiltersBar({ value, onChange, onClear }: Props) {
  const set = (patch: Partial<MaintFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/60 p-3 shadow-sm">
      {/* search */}
      <div className="relative">
        <input
          value={value.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Search vehicle, vendor, description…"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#7a1f2a] focus:ring-2 focus:ring-[#7a1f2a]/30"
        />
      </div>

      {/* chips */}
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <Select
          label="Type"
          value={value.category}
          items={TYPES}
          onChange={(v) => set({ category: v })}
        />
        <Select
          label="Status"
          value={value.status}
          items={STATUSES}
          onChange={(v) => set({ status: v })}
        />
        <Select
          label="Next due"
          value={value.due}
          items={DUE}
          onChange={(v) => set({ due: v })}
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onClear?.()}
          className="text-xs text-neutral-600 underline decoration-dotted hover:text-neutral-800"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-neutral-600">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none ring-0 focus:border-[#7a1f2a] focus:ring-2 focus:ring-[#7a1f2a]/30"
      >
        {items.map((it) => (
          <option key={it} value={it}>
            {it}
          </option>
        ))}
      </select>
    </label>
  );
}
