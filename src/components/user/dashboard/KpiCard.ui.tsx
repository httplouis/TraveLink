"use client";

import React from "react";
import Sparkline from "@/components/user/dashboard/Sparkline";

type Props = {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number[];
  color?: string; // <- add this
};

export default function KpiCard({
  icon,
  label,
  value,
  trend = [],
  color = "#7A0010", // default maroon
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gray-50">
            {icon}
          </span>
          <div className="text-sm">{label}</div>
        </div>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
      </div>

      {trend.length > 1 && (
        <div className="mt-2">
          <Sparkline data={trend} color={color} />
        </div>
      )}
    </div>
  );
}
