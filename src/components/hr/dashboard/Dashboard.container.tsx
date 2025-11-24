"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "@/components/user/dashboard/DashboardView";
import DashboardSkeleton from "@/components/common/skeletons/DashboardSkeleton";
import CommandPalette from "@/components/common/CommandPalette";
import { createLogger } from "@/lib/debug";

export default function HRDashboardContainer() {
  const router = useRouter();
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [userName, setUserName] = React.useState<string>("HR");
  const [kpis, setKpis] = React.useState([
    { label: "Pending Approvals", value: 0 },
    { label: "Active Requests", value: 0 },
    { label: "This Month", value: 0 },
  ]);
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [aiInsights, setAiInsights] = React.useState<any>(null);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const logger = createLogger("HRDashboard");

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        logger.info("Loading dashboard data...");

        // Fetch critical data first
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/profile', { cache: 'force-cache', next: { revalidate: 60 } }).catch(() => ({ ok: false })),
          fetch('/api/hr/stats', { cache: 'no-store' }).catch(() => ({ ok: false })),
        ]);

        const profileData = await profileRes.json().catch(() => ({ ok: false }));
        if (profileData.ok && profileData.data?.name) {
          // Import name formatting utility to skip titles like "Dr.", "Atty."
          const { getDisplayName } = await import('@/lib/utils/name-formatting');
          const displayName = getDisplayName(profileData.data.name);
          setUserName(displayName);
        }

        const statsData = await statsRes.json().catch(() => ({ ok: false }));
        logger.info("HR stats data received:", statsData);
        if (statsData.ok && statsData.data) {
          logger.info("Setting HR KPIs with data:", statsData.data);
          setKpis([
            { label: "Pending Approvals", value: Number(statsData.data.pendingApprovals) || 0 },
            { label: "Active Requests", value: Number(statsData.data.activeRequests) || 0 },
            { label: "This Month", value: Number(statsData.data.thisMonth) || 0 },
          ]);
        } else {
          logger.warn("HR stats data not OK or missing. Response:", statsData);
          setKpis([
            { label: "Pending Approvals", value: 0 },
            { label: "Active Requests", value: 0 },
            { label: "This Month", value: 0 },
          ]);
        }

        // Fetch non-critical data in parallel
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
        logger.success("Dashboard data loaded successfully");
      } catch (err) {
        logger.error('Failed to fetch dashboard data:', err);
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
          { id: "new", label: "New request", shortcut: "N", run: () => router.push("/hr/request") },
          { id: "schedule", label: "Open schedule", shortcut: "S", run: () => router.push("/hr/schedule") },
          { id: "inbox", label: "Inbox", run: () => router.push("/hr/inbox") },
          { id: "submissions", label: "My submissions", run: () => router.push("/hr/request/submissions") },
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
        onOpenSchedule={() => router.push("/hr/schedule")}
        onNewRequest={() => router.push("/hr/request")}
      />
    </>
  );
}
