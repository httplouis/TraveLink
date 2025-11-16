"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "@/components/user/dashboard/DashboardView";
import DashboardSkeleton from "@/components/common/skeletons/DashboardSkeleton";
import CommandPalette from "@/components/common/CommandPalette";

export default function VPDashboardContainer() {
  const router = useRouter();
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [userName, setUserName] = React.useState<string>("VP");
  const [kpis, setKpis] = React.useState([
    { label: "Pending Approvals", value: 0 },
    { label: "Active Requests", value: 0 },
    { label: "This Month", value: 0 },
  ]);
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [aiInsights, setAiInsights] = React.useState<any>(null);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [profileRes, vehiclesRes, statsRes, analyticsRes, aiInsightsRes, activityRes] = await Promise.all([
          fetch('/api/profile').catch(() => ({ ok: false })),
          fetch('/api/vehicles?status=available').catch(() => ({ ok: false })),
          fetch('/api/vp/stats').catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/analytics').catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/ai-insights').catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/recent-activity').catch(() => ({ ok: false })),
        ]);

        const profileData = await profileRes.json().catch(() => ({ ok: false }));
        if (profileData.ok && profileData.data?.name) {
          const firstName = profileData.data.name.split(' ')[0];
          setUserName(firstName);
        }

        const vehiclesData = await vehiclesRes.json().catch(() => ({ ok: false }));
        if (vehiclesData.ok) {
          setVehicles(vehiclesData.data || []);
        }

        const statsData = await statsRes.json().catch(() => ({ ok: false }));
        if (statsData.ok && statsData.data) {
          setKpis([
            { label: "Pending Approvals", value: statsData.data.pendingApprovals || 0 },
            { label: "Active Requests", value: statsData.data.activeRequests || 0 },
            { label: "This Month", value: statsData.data.thisMonth || 0 },
          ]);
        }

        const analyticsData = await analyticsRes.json().catch(() => ({ ok: false }));
        if (analyticsData.ok) {
          setAnalytics(analyticsData.data);
        }

        const aiData = await aiInsightsRes.json().catch(() => ({ ok: false }));
        if (aiData.ok) {
          setAiInsights(aiData.data);
        }

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
          { id: "new", label: "New request", shortcut: "N", run: () => router.push("/vp/request") },
          { id: "schedule", label: "Open schedule", shortcut: "S", run: () => router.push("/vp/schedule") },
          { id: "inbox", label: "Inbox", run: () => router.push("/vp/inbox") },
          { id: "submissions", label: "My submissions", run: () => router.push("/vp/request/submissions") },
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
        onOpenSchedule={() => router.push("/vp/schedule")}
        onNewRequest={() => router.push("/vp/request")}
      />
    </>
  );
}

