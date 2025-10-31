// src/app/(protected)/admin/schedule/SchedulePageClient.tsx
"use client";

import * as React from "react";

/* KPI */
import KpiGrid from "@/components/admin/schedule/ui/KpiGrid.ui";
import { useScheduleKpis } from "@/components/admin/schedule/kpi/useScheduleKpis";

/* New Calendar section (mirrors Request → Calendar) */
import { AdminScheduleCalendarSection } from "@/components/admin/schedule/calendar";

export default function SchedulePageClient() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  const { kpis, refresh: refreshKpis } = useScheduleKpis();

  // Refresh KPIs after mount
  React.useEffect(() => {
    if (!hydrated) return;
    refreshKpis();
  }, [hydrated, refreshKpis]);

  if (!hydrated) {
    return (
      <div className="space-y-3">
        {/* KPI skeleton */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4">
              <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-neutral-200" />
            </div>
          ))}
        </div>
        {/* Calendar skeleton */}
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-3 h-6 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="h-72 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* KPI cards (keep) */}
      <KpiGrid kpis={kpis} />

      {/* NEW: Calendar placed under KPI + (keep any Driver Utilization that lives inside your KPI section) */}
      <AdminScheduleCalendarSection />
    </div>
  );
}
