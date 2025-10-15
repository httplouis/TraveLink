"use client";
import React from "react";
import clsx from "clsx";

export default function AvailabilityBadge({
  v,
}: { v: "available" | "in-use" | "maintenance" | "on-trip" | "off-duty" }) {
  const map: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    "in-use": "bg-amber-100 text-amber-800",
    "on-trip": "bg-amber-100 text-amber-800",
    maintenance: "bg-red-100 text-red-800",
    "off-duty": "bg-neutral-200 text-neutral-700",
  };
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", map[v] ?? "bg-neutral-100 text-neutral-700")}>
      {v.replace("-", " ")}
    </span>
  );
}
