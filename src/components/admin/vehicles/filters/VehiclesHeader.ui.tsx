"use client";
import * as React from "react";
import { LayoutGrid, List, Plus, RotateCw } from "lucide-react";
import { VEHICLE_TABS, type VehiclePrimaryTab } from "../ui/constants";

export function VehiclesHeader({
  counts, tab, onTab, view, onView, onCreate, onReset,
}: {
  counts: Partial<Record<VehiclePrimaryTab, number>>;
  tab: VehiclePrimaryTab;
  onTab: (t: VehiclePrimaryTab) => void;
  view: "grid" | "table";
  onView: (v: "grid" | "table") => void;
  onCreate: () => void;
  onReset?: () => void; // DEV only
}) {
  const showSeed = typeof process !== "undefined" && process.env.NEXT_PUBLIC_SHOW_SEED === "1";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-lg font-semibold">Vehicles</div>
        <div className="text-sm text-gray-500">Manage assets, availability, and service status</div>
      </div>

      <div className="flex items-center gap-2">
        {showSeed && onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            title="Reset sample data"
          >
            <RotateCw size={16} /> Reset sample
          </button>
        )}
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-white"
          style={{ background: "#7a0019" }}
        >
          <Plus size={16} /> Add vehicle
        </button>
        <div className="inline-flex rounded-md border bg-white">
          <button onClick={() => onView("grid")} className={`px-2.5 py-1.5 ${view === "grid" ? "bg-gray-100" : ""}`} title="Grid">
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => onView("table")} className={`px-2.5 py-1.5 ${view === "table" ? "bg-gray-100" : ""}`} title="Table">
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="mt-2 flex min-w-max items-center gap-1 border-b">
          {VEHICLE_TABS.map(t => {
            const selected = tab === t.key;
            const n = counts[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                className={`px-3 py-2 text-sm ${selected ? "border-b-2 border-gray-900 font-medium" : "text-gray-600"}`}
              >
                {t.label} {n ? <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">{n}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
