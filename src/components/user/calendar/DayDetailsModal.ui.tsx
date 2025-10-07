"use client";

import type { Trip } from "@/lib/user/schedule/types";

type Props = {
  open: boolean;
  date: Date | null;
  trips: Trip[];
  onClose: () => void;
};

export default function DayDetailsModal({ open, date, trips, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={onClose}>
      <div
        className="max-w-lg w-[92vw] rounded-2xl bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {date ? date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "Day"}
          </h2>
          <button onClick={onClose} className="rounded-md border px-2 py-1 text-sm">Close</button>
        </div>

        {trips.length === 0 ? (
          <p className="text-sm text-neutral-600">No trips scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {trips.map((t) => (
              <li key={t.id} className="rounded-xl border p-3">
                <div className="text-sm font-medium">{t.destination}</div>
                <div className="text-xs text-neutral-600">
                  {new Date(t.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {new Date(t.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-700">
                  <span><span className="text-neutral-500">Vehicle:</span> {t.vehicle}</span>
                  <span><span className="text-neutral-500">Dept:</span> {t.department}</span>
                  <span><span className="text-neutral-500">Status:</span> {t.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
