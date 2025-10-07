"use client";

import MiniCalendarWidget from "@/components/user/calendar/MiniCalendarWidget.ui";
import UpcomingList from "@/components/user/calendar/UpcomingList.ui"; // from the schedule split
import type { Trip } from "@/lib/user/schedule/types";

type KPI = { label: string; value: number | string; sub?: string };
type Props = {
  kpis: KPI[];
  trips: Trip[];
  onOpenSchedule?: () => void;
};

export default function DashboardView({ kpis, trips, onOpenSchedule }: Props) {
  // take the next few trips for the dashboard list
  const now = new Date();
  const upcoming = [...trips]
    .filter(t => new Date(t.start) >= now)
    .sort((a,b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{k.value}</div>
            {k.sub ? <div className="text-xs text-gray-500">{k.sub}</div> : null}
          </div>
        ))}
      </div>

      {/* Overview row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left: mini calendar */}
        <div className="xl:col-span-1">
          <MiniCalendarWidget
            trips={trips}
            onOpenSchedule={onOpenSchedule}
            title="Next requests"
            maxItems={6}
          />
        </div>

        {/* Right: upcoming + approvals */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-900">Upcoming (next 6)</div>
            <UpcomingList trips={upcoming} />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-900">Pending approvals</div>
            {/* TODO: replace with your approvals list component */}
            <p className="text-sm text-gray-500">No pending approvals.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
