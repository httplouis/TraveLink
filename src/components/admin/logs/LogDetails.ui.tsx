"use client";
import * as React from "react";
import type { LogEntry } from "@/lib/admin/logs/types";

export function LogDetails({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="w-[min(720px,96vw)] max-h-[90vh] overflow-auto bg-white rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Log Details</h3>
          <button onClick={onClose} className="px-2 py-1 rounded-md border bg-white">Close</button>
        </div>

        <div className="grid gap-2 text-sm">
          <Row k="Time" v={new Date(log.timestampISO).toLocaleString()} />
          <Row k="Actor" v={`${log.actorName} (${log.actorType})`} />
          <Row k="Action" v={log.action} />
          <Row k="Entity" v={`${log.entityType}${log.entityLabel ? ` • ${log.entityLabel}` : ""}`} />
          <Row k="Severity" v={log.severity} />
          {log.ip && <Row k="IP" v={log.ip} />}
          <div>
            <div className="text-gray-500 mb-1">Details</div>
            <pre className="text-xs bg-gray-50 rounded-md p-3 whitespace-pre-wrap">{log.details ?? "-"}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="text-gray-500">{k}</div>
      <div className="text-gray-800">{v}</div>
    </div>
  );
}
