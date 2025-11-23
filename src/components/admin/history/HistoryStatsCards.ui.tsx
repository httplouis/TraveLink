// src/components/admin/history/HistoryStatsCards.ui.tsx
"use client";

import type { HistoryStats } from "@/lib/admin/history/types";
import { CheckCircle2, Wrench, TrendingUp } from "lucide-react";

type Props = {
  stats: HistoryStats;
};

export default function HistoryStatsCards({ stats }: Props) {
  const cards = [
    {
      label: "Completed Requests",
      value: stats.totalRequests,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-700 border-green-200",
      iconColor: "text-green-600",
    },
    {
      label: "Completed Maintenance",
      value: stats.totalMaintenance,
      icon: Wrench,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Maintenance Cost",
      value: `₱${stats.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ({ className }: { className?: string }) => <span className={`text-2xl font-bold ${className || ""}`}>₱</span>,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      label: "Completed This Month",
      value: stats.completedThisMonth,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

