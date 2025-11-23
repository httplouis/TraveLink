"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "./DashboardView";
import DashboardSkeleton from "@/components/common/skeletons/DashboardSkeleton";
import CommandPalette from "@/components/common/CommandPalette";
import { createLogger } from "@/lib/debug";
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
  const [approvedRequests, setApprovedRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const logger = createLogger("UserDashboard");

  React.useEffect(() => {
    // Fetch all dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        logger.info("Loading dashboard data...");

        // Fetch critical data first (profile, stats) - these are needed immediately
        let profileData: any = { ok: false };
        let statsData: any = { ok: false };
        
        try {
          const profileRes = await fetch('/api/profile', { cache: 'no-store' });
          if (profileRes.ok) {
            profileData = await profileRes.json();
          } else {
            logger.warn("Profile API not OK. Status:", profileRes.status, profileRes.statusText);
            try {
              profileData = await profileRes.json();
            } catch (e) {
              // Ignore parse errors for error responses
            }
          }
        } catch (err) {
          logger.error("Profile fetch error:", err);
        }
        
        try {
          const statsRes = await fetch('/api/user/dashboard/stats', { cache: 'no-store' });
          if (statsRes.ok) {
            statsData = await statsRes.json();
            logger.info("Stats data received:", statsData);
          } else {
            logger.warn("Stats API not OK. Status:", statsRes.status, statsRes.statusText);
            try {
              statsData = await statsRes.json();
              logger.warn("Stats error response:", statsData);
            } catch (e) {
              // Ignore parse errors for error responses
            }
          }
        } catch (err) {
          logger.error("Stats fetch error:", err);
        }
        
        // Process profile data
        if (profileData.ok && profileData.data?.name) {
          // Import name formatting utility to skip titles like "Dr.", "Atty."
          const { getDisplayName } = await import('@/lib/utils/name-formatting');
          const displayName = getDisplayName(profileData.data.name);
          setUserName(displayName);
        }
        
        // Process stats data
        if (statsData.ok && statsData.data) {
          logger.info("Setting KPIs with data:", statsData.data);
          setKpis([
            { label: "Active Requests", value: statsData.data.activeRequests ?? 0 },
            { label: "Vehicles Online", value: statsData.data.vehiclesOnline ?? 0 },
            { label: "Pending Approvals", value: statsData.data.pendingApprovals ?? 0 },
          ]);
        } else {
          logger.warn("Stats data not OK or missing. Response:", statsData);
          // Keep default KPIs (0 values) if API fails
        }

        // Fetch non-critical data in parallel (can load after initial render)
        const [vehiclesRes, analyticsRes, aiInsightsRes, activityRes, approvedRes] = await Promise.all([
          fetch('/api/vehicles?status=available', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/analytics', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/ai-insights', { cache: 'force-cache', next: { revalidate: 300 } }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/recent-activity', { cache: 'no-store' }).catch(() => ({ ok: false })),
          fetch('/api/user/dashboard/approved-requests', { cache: 'no-store' }).catch(() => ({ ok: false })),
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

        // Process approved requests
        const approvedData = await approvedRes.json().catch(() => ({ ok: false }));
        if (approvedData.ok) {
          setApprovedRequests(approvedData.data || []);
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
