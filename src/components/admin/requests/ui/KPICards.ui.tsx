// src/components/admin/requests/ui/KPICards.ui.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, CheckSquare, XCircle } from "lucide-react";

type KPISummary = {
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
};

type Props = {
  summary: KPISummary;
};

export default function KPICards({ summary }: Props) {
  const cards = [
    {
      label: "Pending",
      value: summary.pending,
      Icon: Clock,
      color: "orange",
      bgGradient: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      barColor: "bg-orange-500",
    },
    {
      label: "Approved",
      value: summary.approved,
      Icon: CheckCircle,
      color: "green",
      bgGradient: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      barColor: "bg-green-500",
    },
    {
      label: "Completed",
      value: summary.completed,
      Icon: CheckSquare,
      color: "blue",
      bgGradient: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      barColor: "bg-blue-500",
    },
    {
      label: "Rejected",
      value: summary.rejected,
      Icon: XCircle,
      color: "red",
      bgGradient: "from-red-50 to-red-100",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      barColor: "bg-red-500",
    },
  ];

  const total = summary.pending + summary.approved + summary.completed + summary.rejected;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const percentage = total > 0 ? (card.value / total) * 100 : 0;

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`relative overflow-hidden rounded-xl border-2 ${card.borderColor} bg-gradient-to-br ${card.bgGradient} p-5 shadow-sm hover:shadow-md transition-all duration-300 group`}
          >
            {/* Icon Circle */}
            <div className={`absolute top-3 right-3 h-12 w-12 rounded-full ${card.iconBg} flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity`}>
              <card.Icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>

            {/* Label */}
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-600 mb-2">
              {card.label}
            </div>

            {/* Value */}
            <div className={`text-4xl font-bold ${card.textColor} mb-3`}>
              {card.value}
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.6, ease: "easeOut" }}
                className={`h-full ${card.barColor} rounded-full`}
              />
            </div>

            {/* Percentage */}
            <div className="mt-2 text-xs font-medium text-neutral-600">
              {percentage.toFixed(1)}% of total
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
