// src/components/user/dashboard/AnalyticsChart.ui.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface MonthlyData {
  month: string;
  total: number;
  approved: number;
  pending: number;
}

interface Props {
  monthlyTrends: MonthlyData[];
  className?: string;
}

export default function AnalyticsChart({ monthlyTrends, className = "" }: Props) {
  if (!monthlyTrends || monthlyTrends.length === 0) {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-xl ring-1 ring-gray-200/50 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Request Trends</h3>
          </div>
          <div className="text-center py-12">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No data available yet</p>
            <p className="mt-1 text-xs text-gray-400">Submit requests to see trends</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...monthlyTrends.map(m => Math.max(m.total, m.approved, m.pending)));
  const maxHeight = 140; // Max height in pixels

  const getHeight = (value: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * maxHeight;
  };

  const latest = monthlyTrends[monthlyTrends.length - 1];
  const previous = monthlyTrends[monthlyTrends.length - 2];
  const trend = previous && previous.total > 0
    ? ((latest.total - previous.total) / previous.total) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-xl ring-1 ring-gray-200/50 ${className}`}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-blue-200/20 to-indigo-200/20 blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Request Trends (6 Months)</h3>
              <p className="text-xs text-gray-500">Monthly request overview</p>
            </div>
          </div>
          {trend !== 0 && (
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(Math.round(trend))}%</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Chart */}
          <div className="flex items-end justify-between gap-2 h-[160px]">
            {monthlyTrends.map((data, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex-1 flex flex-col items-center gap-2 group"
              >
                <div className="relative w-full h-[140px] flex items-end justify-center">
                  {/* Total bar (background) */}
                  {data.total > 0 && (
                    <div
                      className="absolute w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80"
                      style={{
                        height: `${getHeight(data.total)}px`,
                        backgroundColor: '#e5e7eb',
                      }}
                    />
                  )}
                  {/* Approved bar */}
                  {data.approved > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${getHeight(data.approved)}px` }}
                      transition={{ delay: idx * 0.1 + 0.3, duration: 0.5 }}
                      className="absolute w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-lg group-hover:from-emerald-600 group-hover:to-emerald-500 transition-all duration-300"
                      style={{ zIndex: 2 }}
                    />
                  )}
                  {/* Pending bar */}
                  {data.pending > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${getHeight(data.pending)}px` }}
                      transition={{ delay: idx * 0.1 + 0.4, duration: 0.5 }}
                      className="absolute w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-400 shadow-lg group-hover:from-amber-600 group-hover:to-amber-500 transition-all duration-300"
                      style={{
                        bottom: `${getHeight(data.approved)}px`,
                        zIndex: 1,
                      }}
                    />
                  )}
                </div>
                <div className="text-xs font-bold text-gray-700 mt-1">{data.month}</div>
                <div className="text-xs font-semibold text-gray-500">{data.total}</div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200/50">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Total</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
