"use client";
import * as React from "react";
import type { MaintStatus } from "@/lib/admin/maintenance/types";
const STATES: MaintStatus[] = ["Submitted","Acknowledged","In-Progress","Completed","Rejected"];
export default function StatusSwitch({ value, onChange }: { value: MaintStatus; onChange: (s: MaintStatus) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as MaintStatus)} className="h-8 px-2 rounded-md border border-neutral-300">
      {STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
    </select>
  );
}
