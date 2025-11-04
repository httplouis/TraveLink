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
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 hover:shadow-xl hover:ring-2 hover:ring-gray-200 transition-all duration-300"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.span 
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 group-hover:from-[#7A0010]/10 group-hover:to-[#7A0010]/5 group-hover:text-[#7A0010] transition-all duration-300"
            >
              {icon}
            </motion.span>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
            </div>
          </div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-3xl font-bold text-gray-900"
          >
            {value}
          </motion.div>
        </div>

        {trend.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <Sparkline data={trend} color={color} />
            <div className="mt-1 flex items-center gap-1 text-xs">
              {trend[trend.length - 1] > trend[0] ? (
                <>
                  <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="font-medium text-green-600">Trending up</span>
                </>
              ) : (
                <>
                  <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium text-gray-500">Stable</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
