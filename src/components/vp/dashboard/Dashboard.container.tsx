"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "@/components/user/dashboard/DashboardView";
import DashboardSkeleton from "@/components/common/skeletons/DashboardSkeleton";
import CommandPalette from "@/components/common/CommandPalette";
import { createLogger } from "@/lib/debug";

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

  const logger = createLogger("VPDashboard");

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        logger.info("Loading dashboard data...");

        // Fetch critical data first
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/profile', { cache: 'force-cache', next: { revalidate: 60 } }).catch(() => ({ ok: false, headers: new Headers() })),
          fetch('/api/vp/stats', { cache: 'no-store' }).catch(() => ({ ok: false, headers: new Headers() })),
        ]);

        let profileData: any = { ok: false };
        if (profileRes.ok && 'json' in profileRes) {
          const contentType = profileRes.headers?.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              profileData = await (profileRes as Response).json();
            } catch (e) {
              logger.warn("Failed to parse profile JSON:", e);
            }
          }
        }
        if (profileData.ok && profileData.data?.name) {
          // Import name formatting utility to skip titles like "Dr.", "Atty."
          const { getDisplayName } = await import('@/lib/utils/name-formatting');
          const displayName = getDisplayName(profileData.data.name);
          setUserName(displayName);
        }

        let statsData: any = { ok: false };
        if (statsRes.ok && 'json' in statsRes) {
          const contentType = statsRes.headers?.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              statsData = await (statsRes as Response).json();
            } catch (e) {
              logger.warn("Failed to parse stats JSON:", e);
            }
          }
        }
        if (statsData.ok && statsData.data) {
          setKpis([
            { label: "Pending Approvals", value: statsData.data.pendingApprovals || 0 },
            { label: "Active Requests", value: statsData.data.activeRequests || 0 },
            { label: "This Month", value: statsData.data.thisMonth || 0 },
          ]);
        }

        // Fetch non-critical data in parallel
        const [vehiclesRes, analyticsRes, aiInsightsRes, activityRes] = await Promise.all([
          fetch('/api/vehicles?status=available', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false, headers: new Headers() })),
          fetch('/api/user/dashboard/analytics', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false, headers: new Headers() })),
          fetch('/api/user/dashboard/ai-insights', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false, headers: new Headers() })),
          fetch('/api/user/dashboard/recent-activity', { cache: 'no-store' }).catch(() => ({ ok: false, headers: new Headers() })),
        ]);

        let vehiclesData: any = { ok: false };
        if (vehiclesRes.ok && 'json' in vehiclesRes) {
          const contentType = vehiclesRes.headers?.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              vehiclesData = await (vehiclesRes as Response).json();
            } catch (e) {
              logger.warn("Failed to parse vehicles JSON:", e);
            }
          }
        }
        if (vehiclesData.ok) {
          setVehicles(vehiclesData.data || []);
        }

        let analyticsData: any = { ok: false };
        if (analyticsRes.ok && 'json' in analyticsRes) {
          const contentType = analyticsRes.headers?.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              analyticsData = await (analyticsRes as Response).json();
            } catch (e) {
              logger.warn("Failed to parse analytics JSON:", e);
            }
          }
        }
        if (analyticsData.ok) {
          setAnalytics(analyticsData.data);
        }

        let aiData: any = { ok: false };
        if (aiInsightsRes.ok && 'json' in aiInsightsRes) {
          const contentType = aiInsightsRes.headers?.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              aiData = await (aiInsightsRes as Response).json();
            } catch (e) {
              logger.warn("Failed to parse AI insights JSON:", e);
            }
          }
        }
        if (aiData.ok) {
          setAiInsights(aiData.data);
        }

        let activityData: any = { ok: false };
        if (activityRes.ok && 'json' in activityRes) {
          const contentType = activityRes.headers?.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              activityData = await (activityRes as Response).json();
            } catch (e) {
              logger.warn("Failed to parse activity JSON:", e);
            }
          }
        }
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

