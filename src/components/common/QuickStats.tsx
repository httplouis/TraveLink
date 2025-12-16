"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatItem {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  bgColor?: string;
}

interface QuickStatsProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export default function QuickStats({ stats, columns = 4 }: QuickStatsProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 p-5"
        >
          {/* Background gradient */}
          <div
            className={`absolute inset-0 opacity-5 ${stat.bgColor || "bg-gradient-to-br from-blue-500 to-indigo-600"}`}
          />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color || "text-gray-900"}`}>
                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
              </p>

              {stat.change !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  {stat.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : stat.change < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.change > 0 ? "text-green-600" : stat.change < 0 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {stat.change > 0 ? "+" : ""}
                    {stat.change}%
                  </span>
                  {stat.changeLabel && <span className="text-xs text-gray-400 ml-1">{stat.changeLabel}</span>}
                </div>
              )}
            </div>

            {stat.icon && (
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  stat.bgColor || "bg-gradient-to-br from-blue-500 to-indigo-600"
                } text-white shadow-lg`}
              >
                {stat.icon}
              </div>
            )}
          </div>

          {/* Decorative element */}
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 opacity-50" />
        </motion.div>
      ))}
    </div>
  );
}
