"use client";

import type { Trip } from "@/lib/user/schedule/types";

type Props = {
  date: Date | null;
  trips: Trip[];
  isOpen: boolean;
  onClose: () => void;
};

export default function DayDetailsModal({ date, trips, isOpen, onClose }: Props) {
  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Trips on {date.toDateString()}
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm text-white bg-[#7a0019] rounded"
          >
            Close
          </button>
        </div>

        {trips.length === 0 ? (
          <p className="text-neutral-500">No trips for this day.</p>
        ) : (
          <ul className="divide-y">
            {trips.map((t) => (
              <li key={t.id} className="py-2 text-sm">
                <p className="font-medium">{t.destination}</p>
                <p className="text-neutral-600">
                  {t.vehicle} — {new Date(t.start).toLocaleTimeString()} →{" "}
                  {new Date(t.end).toLocaleTimeString()}
                </p>
                <p className="text-xs italic text-neutral-500">
                  {t.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
