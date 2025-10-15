"use client";

import type { Status } from "@/lib/user/schedule/types";

type Props = {
  title?: string;
  status: Status | "All";
  vehicle: string | "All";
  query: string;
  vehicleOptions: (string | "All")[];
  onStatusChange: (v: Status | "All") => void;
  onVehicleChange: (v: string | "All") => void;
  onQueryChange: (v: string) => void;
};

export default function ScheduleHeader({
  title = "Schedule",
  status,
  vehicle,
  query,
  vehicleOptions,
  onStatusChange,
  onVehicleChange,
  onQueryChange,
}: Props) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-neutral-500">
          Browse your schedule or see upcoming requests at a glance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-xl border px-2 py-1.5 text-sm"
          value={status}
          onChange={(e) => onStatusChange(e.currentTarget.value as Status | "All")}
        >
          {(["All","Pending","Approved","Assigned","Rejected","Completed"] as const).map((s)=>(
            <option key={s} value={s}>Status: {s}</option>
          ))}
        </select>

        <select
          className="rounded-xl border px-2 py-1.5 text-sm"
          value={vehicle}
          onChange={(e) => onVehicleChange(e.currentTarget.value)}
        >
          {vehicleOptions.map((v)=>(
            <option key={v} value={v}>Vehicle: {v}</option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e)=>onQueryChange(e.currentTarget.value)}
          placeholder="Search destination / dept / ID"
          className="w-64 rounded-xl border px-3 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}
