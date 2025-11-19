"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getDisplayName } from "@/lib/utils/name-formatting";

export default function DashboardHero({
  userName = "Traveler",
  onOpenSchedule,
  onNewRequest,
}: {
  userName?: string;
  onOpenSchedule?: () => void;
  onNewRequest?: () => void;
}) {
  // Remove titles from name for display
  const displayName = getDisplayName(userName);
  // REAL-TIME CLOCK - Updates every second
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  const day = currentTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const time = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] p-5 text-white shadow-sm"
    >
      {/* animated grain/shine */}
      <div className="pointer-events-none absolute inset-0 opacity-15">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_-10%_-10%,white_0,transparent_60%)]" />
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence baseFrequency=%220.8%22 numOctaves=%222%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%220.15%22/></svg>')", backgroundSize: "400px 400px" }}
        />
      </div>

      <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm/5 text-white/85 font-medium"
          >
            Welcome to Travelink 👋
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold tracking-tight"
          >
            {displayName}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 text-sm text-white/90">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span suppressHydrationWarning>{day}</span>
            </div>
            <span className="text-white/50">•</span>
            <div className="flex items-center gap-1.5 text-sm font-mono text-white/90 tabular-nums">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <motion.span
                key={time}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                suppressHydrationWarning
              >
                {time}
              </motion.span>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center gap-2"
        >
          {onNewRequest && (
            <button
              onClick={onNewRequest}
              className="group relative overflow-hidden rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#7A0010] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New request
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <button
            onClick={onOpenSchedule}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View schedule
            </span>
          </button>
        </motion.div>
      </div>

    </motion.section>
  );
}
