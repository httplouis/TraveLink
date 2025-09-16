"use client";
import * as React from "react";
import DriverStatusDropdown from "../filters/DriverStatusDropdown.ui";
import ComplianceDropdown from "../filters/ComplianceDropdown.ui";

type Filters = { search?: string; status?: string; compliant?: "ok"|"warn"|"bad"|"" };
type Props = {
  value: Filters;
  onChange: (v: Filters) => void;
  onAdd: () => void;
};

export default function FiltersBar({ value, onChange, onAdd }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
      <input
        placeholder="Search name, employee #, license #"
        className="min-w-[260px] flex-1 rounded border px-3 py-2"
        value={value.search ?? ""}
        onChange={(e)=>set({ search: e.target.value })}
      />
      <DriverStatusDropdown value={value.status ?? ""} onChange={(v)=>set({ status: v })} />
      <ComplianceDropdown value={value.compliant ?? ""} onChange={(v)=>set({ compliant: v as any })} />
      <button className="ml-auto rounded bg-[#7a1f2a] px-3 py-2 text-white hover:opacity-90" onClick={onAdd}>
        Add Driver
      </button>
      <button className="rounded border px-3 py-2 hover:bg-gray-50" onClick={()=>onChange({})}>Clear</button>
    </div>
  );
}
