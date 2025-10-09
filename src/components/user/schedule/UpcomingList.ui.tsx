"use client";

import { useMemo } from "react";
import type { Trip } from "@/lib/user/schedule/types";

export default function UpcomingList({ trips = [] as Trip[] }: { trips?: Trip[] }) {
  const safe: Trip[] = Array.isArray(trips) ? trips : [];

  const groups = useMemo(() => {
    const map = new Map<string, Trip[]>();
    for (const t of safe) {
      const d = new Date(t.start);
      if (isNaN(+d)) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    for (const [, arr] of map) arr.sort((a, b) => +new Date(a.start) - +new Date(b.start));
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [safe]);

  if (safe.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500">
        No upcoming requests match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([key, arr], idx) => {
        const dt = new Date(key);
        const label = dt.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
        return (
          <section key={key} className={`p-5 ${idx !== 0 ? "border-top border-neutral-100" : ""}`}>
            <div className="mb-3 text-sm font-semibold text-neutral-700">{label}</div>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {arr.map((t) => (
                <li
                  key={t.id}
                  className="rounded-xl border border-neutral-200/70 p-3 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate text-sm font-medium text-neutral-900">
                      {t.destination}
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    {new Date(t.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                    –{" "}
                    {new Date(t.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-neutral-500">
                    {t.vehicle} · {t.department} · ID {t.id}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
