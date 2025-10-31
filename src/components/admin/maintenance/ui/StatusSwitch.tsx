"use client";

import * as React from "react";
import type { Maintenance, MaintStatus } from "@/lib/admin/maintenance/types";
import { updateMaintenance as patch } from "@/lib/admin/maintenance/handlers";

type Props = {
  row?: Maintenance | null;
  onChanged?: (m: Maintenance) => void;
};

const ORDER: readonly MaintStatus[] = ["Submitted", "In-Progress", "Completed", "Rejected"] as const;

const COLORS: Record<MaintStatus, string> = {
  Submitted:   "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "In-Progress":"bg-amber-50 text-amber-800 ring-amber-200",
  Completed:   "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected:    "bg-rose-50 text-rose-700 ring-rose-200",
};

function nextStatus(s: MaintStatus | undefined): MaintStatus {
  const cur = s ?? "Submitted";
  const idx = Math.max(0, ORDER.indexOf(cur));
  return ORDER[(idx + 1) % ORDER.length];
}

export default function StatusSwitch({ row, onChanged }: Props) {
  const [busy, setBusy] = React.useState(false);

  if (!row) {
    return (
      <span
        className={[
          "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
          "bg-neutral-100 text-neutral-700 ring-neutral-200",
        ].join(" ")}
        title="Loading status…"
      >
        —
      </span>
    );
  }

  async function cycle() {
    if (busy) return;
    setBusy(true);
    try {
      const next = nextStatus(row.status);
      const updated = (await patch(row.id, { status: next } as Partial<Omit<Maintenance, "id" | "createdAt" | "history">>)) as
        | Maintenance
        | undefined;
      if (updated) onChanged?.(updated);
    } finally {
      setBusy(false);
    }
  }

  const color = COLORS[row.status ?? "Submitted"];

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={busy}
      className={[
        "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        color,
        busy ? "opacity-70 cursor-wait" : "hover:brightness-[0.98]",
      ].join(" ")}
      title="Click to cycle status"
    >
      {row.status ?? "Submitted"}
    </button>
  );
}
