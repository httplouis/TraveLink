"use client";
import React, { useState } from "react";
import type { VehicleStatus } from "@/lib/travilink";

const label = (s: VehicleStatus) =>
  s === "available" ? "Available" : s === "maintenance" ? "Maintenance" : "Offline";

export default function StatusChip({
  current,
  onChange,
}: {
  current: VehicleStatus;
  onChange: (v: VehicleStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  const chipClass: Record<VehicleStatus, string> = {
    available: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    maintenance: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    offline: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };

  const options: { key: VehicleStatus; label: string; note?: string }[] = [
    { key: "available", label: "Available" },
    { key: "maintenance", label: "Maintenance", note: "Under maintenance" },
    { key: "offline", label: "Offline", note: "Temporarily unavailable" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${chipClass[current]} hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0010] focus-visible:ring-offset-2 transition-all`}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current/80" />
        {label(current)}
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-56 rounded-md border border-neutral-200 bg-white shadow-lg p-1 z-20"
          onMouseLeave={() => setOpen(false)}
        >
          {options.map((opt) => (
            <button
              key={opt.key}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-neutral-50 ${current === opt.key ? "bg-neutral-50" : ""}`}
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
            >
              <div className="font-medium">{opt.label}</div>
              {opt.note && <div className="text-xs text-neutral-500">{opt.note}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
