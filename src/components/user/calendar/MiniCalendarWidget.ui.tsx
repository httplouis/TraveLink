"use client";

import { useMemo } from "react";
import type { Trip } from "@/lib/user/schedule/types";
import { Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  trips: Trip[];
  onOpenSchedule?: () => void;
  maxItems?: number;
  title?: string;
};

export default function MiniCalendarWidget({
  trips,
  onOpenSchedule,
  maxItems = 6,
  title = "Next requests",
}: Props) {
  const items = useMemo(() => {
    const now = new Date();
    return [...trips]
      .filter((t) => new Date(t.start) >= now)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start))
      .slice(0, maxItems);
  }, [trips, maxItems]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-xl ring-1 ring-gray-200/50">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5" />
      <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-200/20 to-purple-200/20 blur-3xl" />
      
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          </div>
          {onOpenSchedule && (
            <button 
              onClick={onOpenSchedule} 
              className="group flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
            >
              <span>View full</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-300">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No upcoming trips</p>
            <p className="mt-1 text-xs text-gray-400">Your scheduled requests will appear here</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((t, idx) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50 p-3.5 hover:shadow-md hover:border-violet-300/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 truncate text-sm font-bold text-gray-900">
                      {t.destination}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">
                        {new Date(t.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(t.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(t.end).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                    {t.status}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
