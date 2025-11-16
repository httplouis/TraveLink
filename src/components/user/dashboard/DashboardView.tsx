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
import VehicleShowcase from "@/components/user/dashboard/VehicleShowcase.ui";
import AnalyticsChart from "@/components/user/dashboard/AnalyticsChart.ui";
import AIInsights from "@/components/user/dashboard/AIInsights.ui";
import DashboardSkeleton from "@/components/common/skeletons/DashboardSkeleton";
import type { Trip } from "@/lib/user/schedule/types";
import { ClipboardList, BusFront, Activity } from "lucide-react";

type KPI = { label: string; value: number | string; sub?: string };

type Props = {
  kpis: KPI[];
  trips?: Trip[];
  onOpenSchedule?: () => void;
  onNewRequest?: () => void;
  userName?: string;
  vehicles?: Array<{
    id: string;
    vehicle_name: string;
    plate_number: string;
    type: string;
    capacity: number;
    photo_url?: string;
    status: string;
  }>;
  analytics?: any;
  aiInsights?: any;
  recentActivity?: Array<{ id: string; title: string; meta: string; when: string }>;
  loading?: boolean;
};

export default function DashboardView({
  kpis,
  trips = [],
  onOpenSchedule,
  onNewRequest,
  userName = "User",
  vehicles = [],
  analytics,
  aiInsights,
  recentActivity = [],
  loading = false,
}: Props) {
  const now = new Date();
  const upcoming = Array.isArray(trips)
    ? [...trips]
        .filter((t) => new Date(t.start) >= now)
        .sort((a, b) => +new Date(a.start) - +new Date(b.start))
        .slice(0, 6)
    : [];

  // Generate trend data for KPIs from analytics
  const getTrendData = (index: number) => {
    if (!analytics?.monthlyTrends || analytics.monthlyTrends.length < 2) {
      return [];
    }
    // Return last 5 months of data for the trend sparkline
    return analytics.monthlyTrends.slice(-5).map((m: any) => {
      if (index === 0) return m.total; // Active requests
      if (index === 1) return m.approved; // Vehicles (not applicable, use 0)
      return m.pending; // Pending approvals
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <DashboardHero userName={userName} onOpenSchedule={onOpenSchedule} onNewRequest={onNewRequest} />

      {/* KPI row with stagger */}
      <StaggerIn className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard 
          icon={<ClipboardList className="h-5 w-5" />} 
          label={kpis[0]?.label ?? "Active Requests"} 
          value={kpis[0]?.value ?? 0} 
          trend={getTrendData(0)} 
        />
        <KpiCard 
          icon={<BusFront className="h-5 w-5" />} 
          label={kpis[1]?.label ?? "Vehicles Online"} 
          value={kpis[1]?.value ?? 0} 
          trend={[]} 
        />
        <KpiCard 
          icon={<Activity className="h-5 w-5" />} 
          label={kpis[2]?.label ?? "Pending Approvals"} 
          value={kpis[2]?.value ?? 0} 
          trend={getTrendData(2)} 
        />
      </StaggerIn>

      {/* AI Insights - Only show if AI is enabled */}
      {aiInsights && aiInsights.aiEnabled && (
        <AIInsights insights={aiInsights} loading={loading} />
      )}

      {/* Analytics Chart */}
      {analytics?.monthlyTrends && (
        <AnalyticsChart monthlyTrends={analytics.monthlyTrends} />
      )}

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
          <VehicleShowcase vehicles={vehicles} />
          
          <div className="rounded-2xl bg-white p-4 pb-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-900">Upcoming (next 6)</div>
            <UpcomingList trips={upcoming} />
          </div>

          <ActivityTimeline
            items={recentActivity.length > 0 ? recentActivity : []}
          />
        </div>
      </StaggerIn>
    </div>
  );
}
