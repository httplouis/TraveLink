// components/common/inputs/DateInput.ui.tsx
"use client";
import * as React from "react";
export function DateInput({
  label, value, onChange,
}: { label: string; value: string; onChange:(v:string)=>void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        type="date" className="rounded-md border px-3 py-2"
        value={value} onChange={e=>onChange(e.target.value)}
      />
    </label>
  );
}
