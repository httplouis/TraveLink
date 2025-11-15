// src/components/user/dashboard/AnalyticsChart.ui.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

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
      <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Request Trends</h3>
        </div>
        <div className="text-sm text-gray-500 text-center py-8">
          No data available yet. Submit requests to see trends.
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...monthlyTrends.map(m => Math.max(m.total, m.approved, m.pending)));
  const maxHeight = 120; // Max height in pixels

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
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#7A0010]" />
          <h3 className="text-sm font-semibold text-gray-900">Request Trends (6 Months)</h3>
        </div>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(Math.round(trend))}%</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Chart */}
        <div className="flex items-end justify-between gap-2 h-[140px]">
          {monthlyTrends.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full h-[120px] flex items-end justify-center">
                {/* Total bar (background) */}
                <div
                  className="absolute w-full rounded-t"
                  style={{
                    height: `${getHeight(data.total)}px`,
                    backgroundColor: '#f3f4f6',
                  }}
                />
                {/* Approved bar */}
                {data.approved > 0 && (
                  <div
                    className="absolute w-full rounded-t"
                    style={{
                      height: `${getHeight(data.approved)}px`,
                      backgroundColor: '#10b981',
                      zIndex: 2,
                    }}
                  />
                )}
                {/* Pending bar */}
                {data.pending > 0 && (
                  <div
                    className="absolute w-full rounded-t"
                    style={{
                      height: `${getHeight(data.pending)}px`,
                      bottom: `${getHeight(data.approved)}px`,
                      backgroundColor: '#f59e0b',
                      zIndex: 1,
                    }}
                  />
                )}
              </div>
              <div className="text-xs font-medium text-gray-600 mt-1">{data.month}</div>
              <div className="text-xs text-gray-500">{data.total}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-xs text-gray-600">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-xs text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300" />
            <span className="text-xs text-gray-600">Total</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

