"use client";

import { useEffect } from "react";
import { useScheduleCalendar } from "@/lib/admin/schedule/calendar/store";
import { addMonths, fmtMonthTitle } from "@/lib/admin/schedule/calendar/date";

export default function FiltersBar() {
  const { filters, setMonth, setStatus, setVehicle, setQuery } = useScheduleCalendar();

  useEffect(() => {
    // keep dd/mm/yyyy placeholder consistent with your UI; month is driven by arrows
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
          onClick={() => setMonth(addMonths(filters.monthAnchor, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="min-w-[180px] text-center font-medium">{fmtMonthTitle(filters.monthAnchor)}</div>
        <button
          className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
          onClick={() => setMonth(addMonths(filters.monthAnchor, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Status</label>
        <select
          className="rounded-lg border bg-white px-3 py-1.5 text-sm"
          value={filters.status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="partial">Partial</option>
          <option value="full">Full</option>
        </select>

        <label className="ml-3 text-sm text-gray-600">Vehicle</label>
        <select
          className="rounded-lg border bg-white px-3 py-1.5 text-sm"
          value={filters.vehicleId}
          onChange={(e) => setVehicle(e.target.value as any)}
        >
          <option value="all">All</option>
          {/* Wire real vehicle ids here if you want */}
        </select>

        <input
          className="ml-2 w-64 rounded-lg border bg-white px-3 py-1.5 text-sm"
          placeholder="Search destination / dept / driver / ID"
          value={filters.query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
