// src/components/user/dashboard/AvailabilityHeatmap.ui.tsx
"use client";
import { Trip } from "@/lib/user/schedule/types";
import { getDayStatus } from "@/lib/user/schedule/utils";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export default function AvailabilityHeatmap({ trips }: { trips: Trip[] }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const getColor = (s: "available" | "partial" | "full") => {
    if (s === "full") return "bg-gradient-to-br from-rose-400 to-rose-500";
    if (s === "partial") return "bg-gradient-to-br from-amber-400 to-amber-500";
    return "bg-gradient-to-br from-gray-300 to-gray-400";
  };

  const getHoverColor = (s: "available" | "partial" | "full") => {
    if (s === "full") return "hover:from-rose-500 hover:to-rose-600";
    if (s === "partial") return "hover:from-amber-500 hover:to-amber-600";
    return "hover:from-gray-400 hover:to-gray-500";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-100">
          <Calendar className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Vehicle Availability</div>
          <div className="text-xs text-gray-500">Next 30 days</div>
        </div>
      </div>
      
      <div className="grid grid-cols-10 gap-1.5 mb-4">
        {days.map((d, idx) => {
          const status = getDayStatus(trips, d);
          return (
            <motion.div
              key={d.toDateString()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01 }}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              className="flex aspect-square items-center justify-center rounded-md"
              title={`${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • ${status}`}
            >
              <div className={`h-full w-full rounded-md ${getColor(status)} ${getHoverColor(status)} transition-all duration-200`} />
            </motion.div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-gray-400" />
          <span className="text-xs text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-amber-500" />
          <span className="text-xs text-gray-600">Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-rose-500" />
          <span className="text-xs text-gray-600">Full</span>
        </div>
      </div>
    </div>
  );
}
