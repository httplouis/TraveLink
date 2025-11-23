"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Calendar, Sparkles, TrendingUp } from "lucide-react";

export default function DashboardHero({
  userName = "Traveler",
  onOpenSchedule,
  onNewRequest,
}: {
  userName?: string;
  onOpenSchedule?: () => void;
  onNewRequest?: () => void;
}) {
  // Display full name (titles already removed by container)
  // If userName is already processed, use it as-is; otherwise process it
  const displayName = userName.includes('.') && userName.split(' ').length === 1 
    ? userName // If it's just "Dr." or similar, it means the name wasn't processed properly
    : userName;
  
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7A0010] via-[#8a1a2a] to-[#9c2a3a] p-8 md:p-10 text-white shadow-2xl"
    >
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Welcome & Name */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Welcome back</span>
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent"
            >
              {displayName}
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap items-center gap-4 text-sm md:text-base"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <Calendar className="h-4 w-4" />
                <span suppressHydrationWarning className="font-medium">{day}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <motion.span
                  key={time}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  suppressHydrationWarning
                  className="font-mono font-semibold tabular-nums"
                >
                  {time}
                </motion.span>
              </div>
            </motion.div>
          </div>

          {/* Right: Action Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {onNewRequest && (
              <button
                onClick={onNewRequest}
                className="group relative overflow-hidden flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#7A0010] font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Request
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
              </button>
            )}
            <button
              onClick={onOpenSchedule}
              className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-md text-white font-semibold text-base hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Calendar className="h-5 w-5" />
              View Schedule
            </button>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 pt-6 border-t border-white/20"
        >
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-300" />
              <span className="text-white/80">System Active</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80">All systems operational</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
