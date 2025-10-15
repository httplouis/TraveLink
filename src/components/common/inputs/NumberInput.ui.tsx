// components/common/inputs/NumberInput.ui.tsx
"use client";
import * as React from "react";
export function NumberInput({
  label, value, onChange, min = 0, step = 1,
}: { label: string; value: number; onChange: (v:number)=>void; min?: number; step?: number; }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        type="number" min={min} step={step}
        className="rounded-md border px-3 py-2"
        value={value} onChange={e => onChange(Number(e.target.value))}
      />
    </label>
  );
}
