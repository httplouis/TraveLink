"use client";

import * as React from "react";

export type MaintenanceLog = {
  id: string;
  date: string;           // "YYYY-MM-DD"
  odometer?: number;      // km (optional)
  category: string;       // "Oil Change", "Brake Service", etc.
  description?: string;   // notes
  cost?: number;          // optional
  nextDueDate?: string;   // optional
};

export type VehicleLite = {
  id: string;
  name: string;           // "Bus 12"
  plate: string;          // "ABC-1234"
  type: string;           // "Bus" | "Van"
};

export default function MaintenanceLogsDrawer({
  open,
  onClose,
  vehicle,
  logs,
}: {
  open: boolean;
  onClose: () => void;
  vehicle?: VehicleLite | null;
  logs: MaintenanceLog[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* drawer */}
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl ring-1 ring-neutral-200 animate-in slide-in-from-right"
        role="dialog"
        aria-modal="true"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div>
            <div className="text-xs text-neutral-500">{vehicle?.type}</div>
            <h2 className="text-lg font-semibold">
              {vehicle?.name} • {vehicle?.plate}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm border border-neutral-200 hover:bg-neutral-50"
          >
            Close
          </button>
        </header>

        <section className="p-4 space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-neutral-500">
              No maintenance logs for this vehicle.
            </div>
          ) : (
            logs
              .slice()
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((log) => (
                <article
                  key={log.id}
                  className="rounded-lg border border-neutral-200 p-4 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-neutral-500">
                        {formatDate(log.date)}
                      </div>
                      <div className="font-medium">{log.category}</div>
                    </div>
                    {log.nextDueDate && (
                      <span className="rounded px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200">
                        Next due: {formatDate(log.nextDueDate)}
                      </span>
                    )}
                  </div>

                  {log.description && (
                    <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">
                      {log.description}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600 sm:grid-cols-3">
                    {log.odometer !== undefined && (
                      <div className="rounded border border-neutral-200 px-2 py-1">
                        Odometer:{" "}
                        <span className="font-medium">
                          {log.odometer.toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {log.cost !== undefined && (
                      <div className="rounded border border-neutral-200 px-2 py-1">
                        Cost:{" "}
                        <span className="font-medium">
                          {formatMoney(log.cost)}
                        </span>
                      </div>
                    )}
                    <div className="rounded border border-neutral-200 px-2 py-1">
                      Log ID: <span className="font-mono">{log.id}</span>
                    </div>
                  </div>
                </article>
              ))
          )}
        </section>
      </aside>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatMoney(n: number) {
  try {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(n);
  }
}
