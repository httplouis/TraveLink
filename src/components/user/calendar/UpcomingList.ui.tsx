"use client";

import { useMemo } from "react";
import type { Trip } from "@/lib/user/schedule/types";
import { motion } from "framer-motion";
import { MapPin, Clock, Calendar } from "lucide-react";

export default function UpcomingList({ trips }: { trips: Trip[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, Trip[]>();
    for (const t of trips) {
      const d = new Date(t.start);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    for (const [, arr] of map) arr.sort((a,b)=>+new Date(a.start)-+new Date(b.start));
    return Array.from(map.entries()).sort((a,b)=> (a[0] < b[0] ? -1 : 1));
  }, [trips]);

  if (trips.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-gray-100">
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-600">No upcoming requests</p>
        <p className="mt-1 text-xs text-gray-400">Your scheduled trips will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([key, arr], idx) => {
        const dt = new Date(key);
        const label = dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
        return (
          <motion.section
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${idx !== 0 ? "border-t border-gray-200/50 pt-6" : ""}`}
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
              <h4 className="text-sm font-bold text-gray-900">{label}</h4>
            </div>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {arr.map((t, tripIdx) => (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 + tripIdx * 0.05 }}
                  className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 p-4 hover:shadow-lg hover:border-blue-300/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="truncate text-sm font-bold text-gray-900">{t.destination}</div>
                      </div>
                      <div className="mb-2 flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium">
                            {new Date(t.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" – "}
                            {new Date(t.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {t.vehicle && <span className="font-medium">{t.vehicle}</span>}
                        {t.department && (
                          <>
                            <span>•</span>
                            <span>{t.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
                      {t.status}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        );
      })}
    </div>
  );
}
