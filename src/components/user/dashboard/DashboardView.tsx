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
import ActivityHistory from "@/components/common/ActivityHistory";
import type { Trip } from "@/lib/user/schedule/types";
import { ClipboardList, BusFront, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";

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
  
  // Ensure trips is always an array
  const safeTrips = Array.isArray(trips) ? trips : [];
  
  const upcoming = safeTrips
    .filter((t) => new Date(t.start) >= now)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 6);

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
    <div className="w-full space-y-6 pb-8">
      {/* Hero Section */}
      <DashboardHero userName={userName} onOpenSchedule={onOpenSchedule} onNewRequest={onNewRequest} />

      {/* KPI Cards - Enhanced Design */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <KpiCard 
            icon={<ClipboardList className="h-5 w-5" />} 
            label={kpis[0]?.label ?? "Active Requests"} 
            value={kpis[0]?.value ?? 0} 
            trend={getTrendData(0)}
            color="#7A0010"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <KpiCard 
            icon={<BusFront className="h-5 w-5" />} 
            label={kpis[1]?.label ?? "Vehicles Online"} 
            value={kpis[1]?.value ?? 0} 
            trend={[]}
            color="#10b981"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <KpiCard 
            icon={<Activity className="h-5 w-5" />} 
            label={kpis[2]?.label ?? "Pending Approvals"} 
            value={kpis[2]?.value ?? 0} 
            trend={getTrendData(2)}
            color="#f59e0b"
          />
        </motion.div>
      </div>

      {/* AI Insights - Only show if AI is enabled */}
      {aiInsights && aiInsights.aiEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AIInsights insights={aiInsights} loading={loading} />
        </motion.div>
      )}

      {/* Analytics Chart - Enhanced */}
      {analytics?.monthlyTrends && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AnalyticsChart monthlyTrends={analytics.monthlyTrends} />
        </motion.div>
      )}

      {/* Main Content Grid - Optimized Layout (No Dead Space) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Quick Actions & Calendar (4 columns on lg, full width on smaller) */}
        <div className="space-y-6 lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <QuickActions onNewRequest={onNewRequest} onOpenSchedule={onOpenSchedule} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <AvailabilityHeatmap trips={safeTrips} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <MiniCalendarWidget trips={safeTrips} onOpenSchedule={onOpenSchedule} title="Next requests" maxItems={6} />
          </motion.div>
        </div>

        {/* Right Column - Vehicles, Upcoming, Activity (8 columns on lg, full width on smaller) */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <VehicleShowcase vehicles={vehicles} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-xl ring-1 ring-gray-200/50"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
            <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-200/20 to-indigo-200/20 blur-3xl" />
            
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Upcoming Requests</h3>
                    <p className="text-xs text-gray-500">Your scheduled trips</p>
                  </div>
                </div>
                {upcoming.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {upcoming.length}
                  </span>
                )}
              </div>
              <UpcomingList trips={upcoming} />
            </div>
          </motion.div>

          {recentActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <ActivityTimeline items={recentActivity} />
            </motion.div>
          )}

          {/* My Activity History - Shows user's own actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <ActivityHistory showFilters={true} limit={10} compact={false} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
