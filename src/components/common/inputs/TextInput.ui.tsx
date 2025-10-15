// components/common/inputs/TextInput.ui.tsx
"use client";
import * as React from "react";
export function TextInput({
  label, value, onChange, placeholder, required, disabled,
}: {
  label: string; value: string; onChange: (v: string)=>void;
  placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}{required ? " *" : ""}</span>
      <input
        className="rounded-md border px-3 py-2 disabled:opacity-50"
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
      />
    </label>
  );
}
