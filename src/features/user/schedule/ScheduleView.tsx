"use client";

import { useMemo, useState } from "react";
import BigCalendarContainer from "@/components/user/calendar/BigCalendarContainer";
import DayDetailsModal from "@/components/user/calendar/DayDetailsModal.ui";
import ScheduleHeader from "@/components/user/calendar/ScheduleHeader.ui";
import ScheduleTabs from "@/components/user/calendar/ScheduleTabs.ui";
import UpcomingList from "@/components/user/calendar/UpcomingList.ui";
import type { Trip, Status } from "@/lib/user/schedule/types";
import { getTripsForDay } from "@/lib/user/schedule/utils";
import { applyFilters, type FilterState } from "@/lib/user/schedule/filter";

type Props = { trips: Trip[]; title?: string };
type Tab = "calendar" | "upcoming";

export default function ScheduleView({ trips, title = "Schedule" }: Props) {
  const [tab, setTab] = useState<Tab>("calendar");
  const [mode, setMode] = useState<"month" | "week">("month");
  const [selected, setSelected] = useState<Date | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    status: "All",
    vehicle: "All",
    query: "",
  });

  const vehicleOptions = useMemo(() => {
    const set = new Set(trips.map((t) => t.vehicle).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [trips]);

  const selectedTrips = useMemo(() => {
    const base = selected ? getTripsForDay(trips, selected) : [];
    return applyFilters(base, filters);
  }, [trips, selected, filters]);

  const upcomingFiltered = useMemo(() => {
    const now = new Date();
    const future = trips.filter((t) => new Date(t.start) >= now);
    return applyFilters(future, filters).sort(
      (a, b) => +new Date(a.start) - +new Date(b.start)
    );
  }, [trips, filters]);

  return (
    <div className="w-full">
      <ScheduleHeader
        title={title}
        status={filters.status}
        vehicle={filters.vehicle}
        query={filters.query}
        vehicleOptions={vehicleOptions}
        onStatusChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        onVehicleChange={(v) => setFilters((f) => ({ ...f, vehicle: v }))}
        onQueryChange={(v) => setFilters((f) => ({ ...f, query: v }))}
      />

      <ScheduleTabs active={tab} onChange={setTab} />

      <div className="mx-auto max-w-6xl px-2">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/40">
          {tab === "calendar" ? (
            <div className="p-5">
              <BigCalendarContainer
                trips={trips}
                onSelectDay={setSelected}
                mode={mode}
                onModeChange={setMode}
              />
            </div>
          ) : (
            <UpcomingList trips={upcomingFiltered} />
          )}
        </div>
      </div>

      <DayDetailsModal
        open={!!selected}
        date={selected}
        trips={selectedTrips}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
