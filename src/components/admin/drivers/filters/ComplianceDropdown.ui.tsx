"use client";
import * as React from "react";

export default function ComplianceDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="rounded border px-3 py-2" value={value} onChange={(e)=>onChange(e.target.value)}>
      <option value="">Compliance: All</option>
      <option value="ok">Compliant</option>
      <option value="warn">Expiring soon</option>
      <option value="bad">Expired / missing</option>
    </select>
  );
}
