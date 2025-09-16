"use client";

import { RequestItem } from "@/lib/requests";
import { CheckCircle2, X, XCircle } from "lucide-react";

export default function RequestDrawer({
  row,
  onClose,
  onApprove,
  onReject,
}: {
  row: RequestItem | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (!row) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Request {row.id}</div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 grid gap-3 text-sm">
          <Row label="Created" value={new Date(row.createdAt).toLocaleString()} />
          <Row label="Needed On" value={new Date(row.neededOn).toLocaleString()} />
          <Row label="Requester" value={row.requester} />
          <Row label="Department" value={`${row.department} • ${row.campus}`} />
          <Row label="Route" value={`${row.origin} → ${row.destination}`} />
          <Row label="Passengers" value={String(row.passengers)} />
          <Row label="Status" value={`${row.status}${row.priority === "Urgent" ? " (Urgent)" : ""}`} />
          <div className="grid gap-1">
            <div className="text-xs text-neutral-600">Purpose</div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">{row.purpose}</div>
          </div>
        </div>

        <div className="mt-auto border-t p-3 flex items-center justify-end gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
            onClick={() => onReject(row.id)}
            disabled={row.status !== "Pending"}
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-white"
            style={{ background: "#7A0010" }}
            onClick={() => onApprove(row.id)}
            disabled={row.status !== "Pending"}
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
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
