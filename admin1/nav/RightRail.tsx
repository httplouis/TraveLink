// src/components/nav/RightRail.tsx
"use client";

import Link from "next/link";

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "ok";
}) {
  const tones =
    tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "ok"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-neutral-50 text-neutral-800 border-neutral-200";
  return (
    <div className={`rounded-xl border ${tones} p-3`}>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

export default function RightRail() {
  return (
    <div className="h-full w-full p-4 space-y-4">
      {/* Profile card (replace with real data) */}
      <div className="rounded-xl border border-neutral-200 p-4">
        <div className="text-xs text-neutral-500">PROFILE · ADMIN</div>
        <div className="mt-1 text-lg font-semibold">F22-33538</div>
        <div className="text-neutral-500 text-sm">Department: CCMS</div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">Faculty</span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">Lucena Campus</span>
        </div>
      </div>

      <div className="text-xs font-medium uppercase text-neutral-500 px-1">Today</div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Trips" value="12" />
        <Stat label="On-time" value="10" tone="ok" />
        <Stat label="Pending Approvals" value="5" tone="warn" />
        <Stat label="Unavailable Vehicles" value="1" tone="warn" />
      </div>

      <div className="text-xs font-medium uppercase text-neutral-500 px-1 pt-2">Quick actions</div>
      <div className="flex flex-col gap-2">
        <Link href="/admin/requests?new=1" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
          + Submit Request
        </Link>
        <Link href="/admin/schedule?new=1" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
          + Schedule Trip
        </Link>
        <Link href="/admin/maintenance?new=1" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
          + Maintenance
        </Link>
      </div>
    </div>
  );
}
