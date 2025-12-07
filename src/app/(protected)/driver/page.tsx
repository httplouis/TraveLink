"use client";

import * as React from "react";
import DashboardView from "@/components/driver/dashboard/DashboardView";
import type { Metrics, UpcomingRow } from "@/components/driver/dashboard/DashboardView";
import type { FleetVehicle } from "@/components/driver/FleetSnapshot";

export default function Page() {
  const [metrics, setMetrics] = React.useState<Metrics>({ trips: 0, online: 0, pending: 0 });
  const [upcoming, setUpcoming] = React.useState<UpcomingRow[]>([]);
  const [fleet, setFleet] = React.useState<FleetVehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [feedbackSummary, setFeedbackSummary] = React.useState<{
    total: number;
    averageRating: string;
    recentFeedback: Array<{ rating: number; message: string; userName: string; date: string }>;
  } | null>(null);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch driver dashboard data
        const dashboardRes = await fetch("/api/driver/dashboard");
        const dashboardData = await dashboardRes.json();
        
        if (dashboardData.ok && dashboardData.data) {
          setMetrics(dashboardData.data.metrics);
          setUpcoming(dashboardData.data.upcoming || []);
          setFeedbackSummary(dashboardData.data.feedbackSummary || null);
        }

        // Fetch assigned vehicles (fleet)
        const vehiclesRes = await fetch("/api/driver/vehicles");
        const vehiclesData = await vehiclesRes.json();
        
        if (vehiclesData.ok && vehiclesData.data) {
          setFleet(vehiclesData.data.map((v: any) => ({
            id: v.id,
            name: v.vehicle_name || v.model || "Unknown",
            plate: v.plate_number || "",
            type: v.type || "Unknown",
            status: v.status === "available" ? "available" as const : 
                   v.status === "assigned" ? "assigned" as const : 
                   "maintenance" as const,
            lastMaintenance: v.last_maintenance_date || null,
            nextDue: v.next_maintenance_date || null,
            logs: v.maintenance_logs || [],
          })));
        }
      } catch (err) {
        console.error("[Driver Dashboard] Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscription for assigned requests
    let channel: any = null;
    (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      channel = client
        .channel("driver-dashboard-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "requests",
            filter: "assigned_driver_id=not.is.null",
          },
          () => {
            // Refetch data when requests change
            fetchDashboardData();
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // actions (no maintenance)
  const actions = [
    { icon: null, title: "Upcoming Schedules", desc: "Preview your next trips with dates, time, and locations.", href: "/driver/schedule" },
    { icon: null, title: "Trip History",       desc: "Review completed trips and past assignments.",             href: "/driver/history" },
  ];

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardView
      metrics={metrics}
      upcoming={upcoming}
      actions={actions}
      fleet={fleet}
      feedbackSummary={feedbackSummary}
    />
  );
}
