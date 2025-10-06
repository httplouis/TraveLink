"use client";

import type { Trip } from "@/lib/user/schedule/types";

export default function UpcomingRequests({ upcoming }: { upcoming: Trip[] }) {
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 p-4">
      <h2 className="font-semibold text-lg mb-3">My Upcoming Requests</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-neutral-600">No upcoming requests.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {upcoming.map((t) => (
            <li key={t.id} className="py-3">
              <div className="font-medium">{t.destination}</div>
              <div className="text-sm text-neutral-600">
                {t.vehicle} — {new Date(t.start).toLocaleString()} ({t.status})
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
