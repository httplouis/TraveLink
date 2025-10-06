"use client";

import { useState } from "react";
import DashboardView from "../DashboardView";
import { MOCK_TRIPS } from "@/lib/user/schedule/mock";
import type { Trip } from "@/lib/user/schedule/types";

export default function DashboardContainer() {
  const [tab, setTab] = useState<"calendar" | "upcoming">("calendar");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Mock KPI metrics – later from DB
  const metrics = { active: 5, vehicles: 3, pending: 4 };

  // Upcoming requests (future trips only)
  const upcoming: Trip[] = MOCK_TRIPS.filter(
    (t) => new Date(t.start) >= new Date()
  );

  // Trips for the selected date
  const selectedTrips: Trip[] = selectedDay
    ? MOCK_TRIPS.filter(
        (t) => new Date(t.start).toDateString() === selectedDay.toDateString()
      )
    : [];

  return (
    <DashboardView
      metrics={metrics}
      tab={tab}
      onChangeTab={setTab}
      trips={MOCK_TRIPS}
      upcoming={upcoming}
      selectedDay={selectedDay}
      onSelectDay={setSelectedDay}
      selectedTrips={selectedTrips}
      onCloseModal={() => setSelectedDay(null)}
    />
  );
}
