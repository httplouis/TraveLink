"use client";

import StatsCard from "@/components/user/dashboard/ui/StatsCard.ui";
import BigCalendarContainer from "@/components/user/dashboard/ui/BigCalendarContainer";
import UpcomingRequests from "@/components/user/dashboard/ui/UpcomingRequests.ui";
import DayDetailsModal from "@/components/user/dashboard/ui/DayDetailsModal.ui";
import type { Trip } from "@/lib/user/schedule/types";

type Props = {
  metrics: { active: number; vehicles: number; pending: number };
  tab: "calendar" | "upcoming";
  onChangeTab: (t: "calendar" | "upcoming") => void;
  trips: Trip[];
  upcoming: Trip[];
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
  selectedTrips: Trip[];
  onCloseModal: () => void;
};

export default function DashboardView({
  metrics,
  tab,
  onChangeTab,
  trips,
  upcoming,
  selectedDay,
  onSelectDay,
  selectedTrips,
  onCloseModal,
}: Props) {
  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Active Requests" value={metrics.active} />
        <StatsCard label="Vehicles Online" value={metrics.vehicles} />
        <StatsCard label="Pending Approvals" value={metrics.pending} />
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            tab === "calendar"
              ? "text-white bg-[#7a0019] rounded-md"
              : "text-neutral-700"
          }`}
          onClick={() => onChangeTab("calendar")}
        >
          Calendar
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            tab === "upcoming"
              ? "text-white bg-[#7a0019] rounded-md"
              : "text-neutral-700"
          }`}
          onClick={() => onChangeTab("upcoming")}
        >
          Upcoming Requests
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {tab === "calendar" ? (
          <>
            <BigCalendarContainer trips={trips} onSelectDay={onSelectDay} />
            <DayDetailsModal
              date={selectedDay}
              trips={selectedTrips}
              isOpen={!!selectedDay}
              onClose={onCloseModal}
            />
          </>
        ) : (
          <UpcomingRequests upcoming={upcoming} />
        )}
      </div>
    </div>
  );
}
