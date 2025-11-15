"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "./DashboardView";
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

        // Fetch in parallel
        const [profileRes, vehiclesRes, statsRes, analyticsRes, aiInsightsRes, activityRes] = await Promise.all([
          fetch('/api/profile').catch(() => ({ ok: false })),
          fetch('/api/vehicles?status=available').catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/stats').catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/analytics').catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/ai-insights').catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/recent-activity').catch(() => ({ ok: false })),
        ]);

        // Process profile
        const profileData = await profileRes.json().catch(() => ({ ok: false }));
        if (profileData.ok && profileData.data?.name) {
          const firstName = profileData.data.name.split(' ')[0];
          setUserName(firstName);
        }

        // Process vehicles
        const vehiclesData = await vehiclesRes.json().catch(() => ({ ok: false }));
        if (vehiclesData.ok) {
          setVehicles(vehiclesData.data || []);
        }

        // Process stats
        const statsData = await statsRes.json().catch(() => ({ ok: false }));
        if (statsData.ok && statsData.data) {
          setKpis([
            { label: "Active Requests", value: statsData.data.activeRequests || 0 },
            { label: "Vehicles Online", value: statsData.data.vehiclesOnline || 0 },
            { label: "Pending Approvals", value: statsData.data.pendingApprovals || 0 },
          ]);
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
        loading={loading}
        onOpenSchedule={() => router.push("/user/schedule")}
        onNewRequest={() => router.push("/user/request")}
      />
    </>
  );
}
