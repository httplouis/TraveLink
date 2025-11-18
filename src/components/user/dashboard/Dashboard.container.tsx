"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "./DashboardView";
import DashboardSkeleton from "@/components/common/skeletons/DashboardSkeleton";
import CommandPalette from "@/components/common/CommandPalette";
import type { Trip } from "@/lib/user/schedule/types";

export default function DashboardContainer() {
  const router = useRouter();
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [userName, setUserName] = React.useState<string>("User");
  const [kpis, setKpis] = React.useState([
    { label: "Active Requests", value: 0 },
    { label: "Vehicles Online", value: 0 },
    { label: "Pending Approvals", value: 0 },
  ]);
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [aiInsights, setAiInsights] = React.useState<any>(null);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch all dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch critical data first (profile, stats) - these are needed immediately
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/profile', { cache: 'force-cache', next: { revalidate: 60 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/stats', { cache: 'no-store' }).catch(() => ({ ok: false })),
        ]);

        const profileData = await profileRes.json().catch(() => ({ ok: false }));
        if (profileData.ok && profileData.data?.name) {
          // Import name formatting utility to skip titles like "Dr.", "Atty."
          const { getFirstName } = await import('@/lib/utils/name-formatting');
          const firstName = getFirstName(profileData.data.name);
          setUserName(firstName);
        }

        const statsData = await statsRes.json().catch(() => ({ ok: false }));
        if (statsData.ok && statsData.data) {
          setKpis([
            { label: "Active Requests", value: statsData.data.activeRequests || 0 },
            { label: "Vehicles Online", value: statsData.data.vehiclesOnline || 0 },
            { label: "Pending Approvals", value: statsData.data.pendingApprovals || 0 },
          ]);
        }

        // Fetch non-critical data in parallel (can load after initial render)
        const [vehiclesRes, analyticsRes, aiInsightsRes, activityRes] = await Promise.all([
          fetch('/api/vehicles?status=available', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/analytics', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/ai-insights', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/recent-activity', { cache: 'no-store' }).catch(() => ({ ok: false })),
        ]);

        // Process vehicles
        const vehiclesData = await vehiclesRes.json().catch(() => ({ ok: false }));
        if (vehiclesData.ok) {
          setVehicles(vehiclesData.data || []);
        }

        // Process analytics
        const analyticsData = await analyticsRes.json().catch(() => ({ ok: false }));
        if (analyticsData.ok) {
          setAnalytics(analyticsData.data);
        }

        // Process AI insights
        const aiData = await aiInsightsRes.json().catch(() => ({ ok: false }));
        if (aiData.ok) {
          setAiInsights(aiData.data);
        }

        // Process recent activity
        const activityData = await activityRes.json().catch(() => ({ ok: false }));
        if (activityData.ok) {
          setRecentActivity(activityData.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <CommandPalette
        actions={[
          { id: "new", label: "New request", shortcut: "N", run: () => router.push("/user/request") },
          { id: "schedule", label: "Open schedule", shortcut: "S", run: () => router.push("/user/schedule") },
          { id: "mine", label: "My requests", run: () => router.push("/user/request?tab=mine") },
          { id: "help", label: "Help / FAQ", run: () => router.push("/user/feedback") },
        ]}
      />
      <DashboardView
        kpis={kpis}
        trips={[]}
        vehicles={vehicles}
        userName={userName}
        analytics={analytics}
        aiInsights={aiInsights}
        recentActivity={recentActivity}
        loading={false}
        onOpenSchedule={() => router.push("/user/schedule")}
        onNewRequest={() => router.push("/user/request")}
      />
    </>
  );
}
