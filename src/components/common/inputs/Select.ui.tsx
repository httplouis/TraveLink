// components/common/inputs/Select.ui.tsx
"use client";
import * as React from "react";
export function Select<T extends string>({
  label, value, options, onChange,
}: {
  label: string; value: T; options: readonly T[]; onChange:(v:T)=>void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <select
        className="rounded-md border px-3 py-2 bg-white"
        value={value} onChange={e=>onChange(e.target.value as T)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
