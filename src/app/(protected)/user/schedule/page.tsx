"use client";

import { useMemo, useState } from "react";
import ScheduleView, { type Filters } from "@/components/user/schedule/ScheduleView";
import type { Trip, Vehicle, Status } from "@/components/user/schedule/types";

// TEMP demo data; replace with Supabase fetch later
const TRIPS: Trip[] = [
  { id: "SCH-1001", start: "2025-12-25T08:00", end: "2025-12-25T12:00", vehicle: "Bus", destination: "Tagaytay",     status: "Approved" },
  { id: "SCH-1002", start: "2025-12-28T09:30", end: "2025-12-28T13:30", vehicle: "Van", destination: "MSEUF Lucena", status: "Pending"  },
  { id: "SCH-1003", start: "2026-01-10T06:15", end: "2026-01-10T10:00", vehicle: "Bus", destination: "Batangas",     status: "Assigned" },
  { id: "SCH-0994", start: "2025-11-29T07:30", end: "2025-11-29T11:00", vehicle: "Car", destination: "San Pablo",    status: "Completed"},
  { id: "SCH-0990", start: "2025-11-15T14:00", end: "2025-11-15T16:30", vehicle: "Van", destination: "City Hall",    status: "Rejected" },
];

export default function UserSchedulePage() {
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [filters, setFilters] = useState<Filters>({
    q: "",
    veh: "",
    stat: "",
    from: "",
    to: "",
  });

  const now = new Date();

  const trips = useMemo(() => {
    return TRIPS.filter((t) => {
      const isUpcoming = new Date(t.start) >= now;
      if (tab === "upcoming" && !isUpcoming) return false;
      if (tab === "history" && isUpcoming) return false;

      const hay = `${t.id} ${t.destination} ${t.vehicle} ${t.status}`.toLowerCase();
      if (filters.q && !hay.includes(filters.q.toLowerCase())) return false;

      if (filters.veh && t.vehicle !== (filters.veh as Vehicle)) return false;
      if (filters.stat && t.status !== (filters.stat as Status)) return false;

      if (filters.from && new Date(t.start) < new Date(filters.from)) return false;
      if (filters.to && new Date(t.start) > new Date(filters.to + "T23:59:59")) return false;

      return true;
    }).sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }, [tab, filters, now]);

  const onExportCsv = () => {
    const rows = [
      ["ID", "Start", "End", "Vehicle", "Destination", "Status"],
      ...trips.map((t) => [t.id, t.start, t.end, t.vehicle, t.destination, t.status]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-schedule-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ScheduleView
      tab={tab}
      onTabChange={setTab}
      filters={filters}
      onFiltersChange={(patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))}
      onResetFilters={() => setFilters({ q: "", veh: "", stat: "", from: "", to: "" })}
      onExportCsv={onExportCsv}
      trips={trips}
    />
  );
}
