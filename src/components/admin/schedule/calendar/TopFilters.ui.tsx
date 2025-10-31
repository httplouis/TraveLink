"use client";

import { useScheduleCalendar } from "@/lib/admin/schedule/calendar/store";

export default function TopFilters() {
  const { filters, setStatus, setVehicle, setQuery } = useScheduleCalendar();

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Status</span>
        <select
          className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          value={filters.status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="partial">Partial</option>
          <option value="full">Full</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Vehicle</span>
        <select
          className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          value={filters.vehicleId}
          onChange={(e) => setVehicle(e.target.value as any)}
        >
          <option value="all">All</option>
          {/* plug real vehicle ids here when ready */}
        </select>
      </div>

      <input
        className="h-9 w-[340px] flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
        placeholder="Search destination / dept / driver / ID"
        value={filters.query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <input
        className="h-9 w-[160px] rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        placeholder="dd/mm/yyyy"
        onChange={() => {}}
      />
    </div>
  );
}
