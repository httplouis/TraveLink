"use client";

import React from "react";
import { motion } from "framer-motion";
import Sparkline from "@/components/user/dashboard/Sparkline";

type Props = {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number[];
  color?: string;
};

export default function KpiCard({
  icon,
  label,
  value,
  trend = [],
  color = "#7A0010",
}: Props) {
  // Determine gradient based on label
  const getGradient = () => {
    if (label.toLowerCase().includes("pending") || label.toLowerCase().includes("endorsement")) {
      return "from-orange-500/10 via-amber-500/5 to-orange-500/10";
    }
    if (label.toLowerCase().includes("active") || label.toLowerCase().includes("request")) {
      return "from-blue-500/10 via-indigo-500/5 to-blue-500/10";
    }
    if (label.toLowerCase().includes("department") || label.toLowerCase().includes("month")) {
      return "from-purple-500/10 via-pink-500/5 to-purple-500/10";
    }
    return "from-gray-500/10 via-slate-500/5 to-gray-500/10";
  };

  const getIconBg = () => {
    if (label.toLowerCase().includes("pending") || label.toLowerCase().includes("endorsement")) {
      return "bg-gradient-to-br from-orange-500 to-amber-500";
    }
    if (label.toLowerCase().includes("active") || label.toLowerCase().includes("request")) {
      return "bg-gradient-to-br from-blue-500 to-indigo-500";
    }
    if (label.toLowerCase().includes("department") || label.toLowerCase().includes("month")) {
      return "bg-gradient-to-br from-purple-500 to-pink-500";
    }
    return "bg-gradient-to-br from-gray-500 to-slate-500";
  };

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/50 to-white p-6 shadow-lg ring-1 ring-gray-200/50 hover:shadow-2xl hover:ring-2 hover:ring-gray-300/50 transition-all duration-300"
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Decorative corner accent */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-gray-100/50 to-transparent opacity-50 group-hover:opacity-75 transition-opacity" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.15 }}
              transition={{ duration: 0.5 }}
              className={`grid h-12 w-12 place-items-center rounded-2xl ${getIconBg()} text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}
            >
              {icon}
            </motion.div>
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</div>
            </div>
          </div>
        </div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
          className="mb-4"
        >
          <div className="text-4xl font-extrabold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            {value}
          </div>
        </motion.div>

        {trend.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="h-12 mb-2">
              <Sparkline data={trend} color={color} />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {trend[trend.length - 1] > trend[0] ? (
                <>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Trending up</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Stable</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
