"use client";

import React from "react";
import DashboardHero from "@/components/user/dashboard/DashboardHero.ui";
import QuickActions from "@/components/user/dashboard/QuickActions.ui";
import UpcomingList from "@/components/user/calendar/UpcomingList.ui";
import MiniCalendarWidget from "@/components/user/calendar/MiniCalendarWidget.ui";
import KpiCard from "@/components/user/dashboard/KpiCard.ui";
import StaggerIn from "@/components/common/StaggerIn";
import AvailabilityHeatmap from "@/components/user/dashboard/AvailabilityHeatmap.ui";
import ActivityTimeline from "@/components/user/dashboard/ActivityTimeline.ui";
import type { Trip } from "@/lib/user/schedule/types";
import { ClipboardList, BusFront, Activity } from "lucide-react";

type KPI = { label: string; value: number | string; sub?: string };

type Props = {
  kpis: KPI[];
  trips?: Trip[];
  onOpenSchedule?: () => void;
  onNewRequest?: () => void;
  userName?: string;
};

export default function DashboardView({
  kpis,
  trips = [],
  onOpenSchedule,
  onNewRequest,
  userName = "User",
}: Props) {
  const now = new Date();
  const upcoming = Array.isArray(trips)
    ? [...trips]
        .filter((t) => new Date(t.start) >= now)
        .sort((a, b) => +new Date(a.start) - +new Date(b.start))
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-6">
      <DashboardHero userName={userName} onOpenSchedule={onOpenSchedule} onNewRequest={onNewRequest} />

      {/* KPI row with stagger */}
      <StaggerIn className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={<ClipboardList className="h-5 w-5" />} label={kpis[0]?.label ?? "Active Requests"} value={kpis[0]?.value ?? 0} trend={[2,3,3,4,5]} />
        <KpiCard icon={<BusFront className="h-5 w-5" />} label={kpis[1]?.label ?? "Vehicles Online"} value={kpis[1]?.value ?? 0} trend={[1,1,2,2,3]} />
        <KpiCard icon={<Activity className="h-5 w-5" />} label={kpis[2]?.label ?? "Pending Approvals"} value={kpis[2]?.value ?? 0} trend={[6,5,5,4,4]} />
      </StaggerIn>

      {/* Overview with stagger */}
      <StaggerIn className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 xl:col-span-1">
          <QuickActions onNewRequest={onNewRequest} onOpenSchedule={onOpenSchedule} />
          <AvailabilityHeatmap trips={trips} />
          <MiniCalendarWidget trips={trips} onOpenSchedule={onOpenSchedule} title="Next requests" maxItems={6} />
        </div>

        {/* Right column */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white p-4 pb-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-900">Upcoming (next 6)</div>
            <UpcomingList trips={upcoming} />
          </div>

          <ActivityTimeline
            items={[
              { id: "a1", title: "Trip approved", meta: "Tagaytay • CCMS", when: "2h ago" },
              { id: "a2", title: "Vehicle assigned", meta: "Van • SCH-1002", when: "yesterday" },
              { id: "a3", title: "Request submitted", meta: "San Pablo • CHM", when: "2 days ago" },
            ]}
          />
        </div>
      </StaggerIn>
    </div>
  );
}
