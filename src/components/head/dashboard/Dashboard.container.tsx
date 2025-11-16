"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "@/components/user/dashboard/DashboardView";
import DashboardSkeleton from "@/components/common/skeletons/DashboardSkeleton";
import CommandPalette from "@/components/common/CommandPalette";

export default function HeadDashboardContainer() {
  const router = useRouter();
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [userName, setUserName] = React.useState<string>("Head");
  const [kpis, setKpis] = React.useState([
    { label: "Pending Endorsements", value: 0 },
    { label: "Active Requests", value: 0 },
    { label: "My Department", value: 0 },
  ]);
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [aiInsights, setAiInsights] = React.useState<any>(null);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch critical data first (profile, stats) - these are needed immediately
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/profile', { cache: 'force-cache', next: { revalidate: 60 } }).catch(() => ({ ok: false })),
          fetch('/api/head/stats', { cache: 'no-store' }).catch(() => ({ ok: false })),
        ]);

        const profileData = await profileRes.json().catch(() => ({ ok: false }));
        if (profileData.ok && profileData.data?.name) {
          const firstName = profileData.data.name.split(' ')[0];
          setUserName(firstName);
        }

        const statsData = await statsRes.json().catch(() => ({ ok: false }));
        if (statsData.ok && statsData.data) {
          setKpis([
            { label: "Pending Endorsements", value: statsData.data.pendingEndorsements || 0 },
            { label: "Active Requests", value: statsData.data.activeRequests || 0 },
            { label: "My Department", value: statsData.data.departmentRequests || 0 },
          ]);
        }

        // Fetch non-critical data in parallel (can load after initial render)
        const [vehiclesRes, analyticsRes, aiInsightsRes, activityRes] = await Promise.all([
          fetch('/api/vehicles?status=available', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/analytics', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/ai-insights', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/recent-activity', { cache: 'no-store' }).catch(() => ({ ok: false })),
        ]);

        const vehiclesData = await vehiclesRes.json().catch(() => ({ ok: false }));
        if (vehiclesData.ok) {
          setVehicles(vehiclesData.data || []);
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
          { id: "new", label: "New request", shortcut: "N", run: () => router.push("/head/request") },
          { id: "schedule", label: "Open schedule", shortcut: "S", run: () => router.push("/head/schedule") },
          { id: "inbox", label: "Inbox", run: () => router.push("/head/inbox") },
          { id: "submissions", label: "My submissions", run: () => router.push("/head/request/submissions") },
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
        onOpenSchedule={() => router.push("/head/schedule")}
        onNewRequest={() => router.push("/head/request")}
      />
    </>
  );
}
