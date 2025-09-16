// src/components/admin/history/HistoryDrawer.tsx
"use client";

import { HistoryItem } from "@/lib/history";
import { X } from "lucide-react";

export default function HistoryDrawer({
  row,
  onClose,
}: {
  row: HistoryItem | null;
  onClose: () => void;
}) {
  if (!row) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">History details</div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 grid gap-3 text-sm">
          <Row label="Timestamp" value={new Date(row.ts).toLocaleString()} />
          <Row label="Type" value={row.type} />
          <Row label="Status" value={row.status} />
          <Row label="Actor" value={row.actor} />
          <Row label="Department" value={row.department ?? "—"} />
          <Row label="Reference" value={row.ref ? `${row.ref.kind.toUpperCase()} • ${row.ref.id}` : "—"} />
          <div className="grid gap-1">
            <div className="text-xs text-neutral-600">Title</div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">{row.title}</div>
          </div>
          <div className="grid gap-1">
            <div className="text-xs text-neutral-600">Details</div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 whitespace-pre-line">{row.details}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <div className="text-xs text-neutral-600">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
