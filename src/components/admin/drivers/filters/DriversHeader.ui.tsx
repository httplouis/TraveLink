"use client";
import * as React from "react";
import { LayoutGrid, Rows3, Plus } from "lucide-react";
import type { DriverTab } from "@/lib/admin/drivers/types";

const BRAND = "#7a0019";

export function DriversHeader({
  counts,
  tab,
  onTab,
  view,
  onView,
  onCreate,
  onReset, // optional dev helper
}: {
  counts: {
    all: number;
    available: number;
    on_trip: number;
    off_duty: number;
    suspended: number;
    expired_license: number;
  };
  tab: DriverTab;
  onTab: (t: DriverTab) => void;
  view: "grid" | "table";
  onView: (v: "grid" | "table") => void;
  onCreate: () => void;
  onReset?: () => void;
}) {
  const tabs: { key: DriverTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "available", label: "Available", count: counts.available },
    { key: "on_trip", label: "On Trip", count: counts.on_trip },
    { key: "off_duty", label: "Off Duty", count: counts.off_duty },
    { key: "suspended", label: "Suspended", count: counts.suspended },
    { key: "expired_license", label: "Expired License", count: counts.expired_license },
  ];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Title + Tabs */}
      <div className="min-w-0">
        <div className="text-xl font-semibold tracking-tight">Drivers</div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-white ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {t.label}
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex rounded-lg bg-white ring-1 ring-gray-200 p-1">
          <button
            onClick={() => onView("grid")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm ${
              view === "grid" ? "bg-gray-900 text-white" : "hover:bg-gray-100"
            }`}
            title="Grid view"
          >
            <LayoutGrid size={16} /> Grid
          </button>
          <button
            onClick={() => onView("table")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm ${
              view === "table" ? "bg-gray-900 text-white" : "hover:bg-gray-100"
            }`}
            title="Table view"
          >
            <Rows3 size={16} /> Table
          </button>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm transition"
          style={{ background: BRAND }}
        >
          <Plus size={16} /> Add Driver
        </button>

        {onReset && (
          <button
            onClick={onReset}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            title="Reset sample data (dev)"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
