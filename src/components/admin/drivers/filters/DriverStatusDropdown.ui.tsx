"use client";
import * as React from "react";

export default function DriverStatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="rounded border px-3 py-2" value={value} onChange={(e)=>onChange(e.target.value)}>
      <option value="">Status: All</option>
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
      <option value="archived">Archived</option>
      <option value="pending_verification">Pending verification</option>
    </select>
  );
}
