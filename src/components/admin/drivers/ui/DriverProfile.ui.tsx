"use client";
import * as React from "react";
import type { Driver } from "@/lib/admin/drivers/types";
import { complianceInfo } from "@/lib/admin/drivers/utils";

export default function DriverProfile({ driver }: { driver: Driver }) {
  const initials = `${driver.firstName?.[0] ?? ""}${driver.lastName?.[0] ?? ""}`;
  const c = complianceInfo(driver); // { state, className, label }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gray-200 text-sm font-medium">
          {initials}
        </div>
        <div>
          <div className="text-lg font-semibold">
            {driver.firstName} {driver.lastName}
          </div>
          <div className="text-sm text-gray-500">{driver.email}</div>
        </div>
        <div className="ml-auto">
          <span className={`rounded px-2 py-1 text-xs ${c.className}`}>{c.label}</span>
        </div>
      </div>
      {/* Extend with tabs: Overview | Documents | Assignments | Activity */}
    </div>
  );
}
