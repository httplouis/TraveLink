"use client";

import { useRouter } from "next/navigation";
import DashboardView from "@/components/user/dashboard/DashboardView";
import CommandPalette from "@/components/common/CommandPalette";
import { useEffect, useState } from "react";
import type { Trip } from "@/lib/user/schedule/types";

export default function ExecDashboardContainer() {
  const router = useRouter();
  const [kpis, setKpis] = useState([
    { label: "Executive Pending", value: 0 },
    { label: "Active Requests", value: 0 },
    { label: "Approved This Month", value: 0 },
  ]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userName, setUserName] = useState("Executive");

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(async (data) => {
        if (data.full_name) {
          // Import name formatting utility to skip titles like "Dr.", "Atty."
          const { getDisplayName } = await import('@/lib/utils/name-formatting');
          const displayName = getDisplayName(data.full_name);
          setUserName(displayName);
        }
      });

    fetch("/api/exec/stats")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setKpis([
            { label: "Executive Pending", value: data.pending_count || 0 },
            { label: "Active Requests", value: data.active_count || 0 },
            { label: "Approved This Month", value: data.approved_month || 0 },
          ]);
        }
      });

    fetch("/api/schedule")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setTrips(data.trips || []);
      });
  }, []);

  return (
    <>
      <CommandPalette
        actions={[
          { id: "review", label: "Executive review", shortcut: "R", run: () => router.push("/exec/review") },
          { id: "new", label: "New request", shortcut: "N", run: () => router.push("/exec/request") },
          { id: "schedule", label: "Open schedule", shortcut: "S", run: () => router.push("/exec/schedule") },
          { id: "mine", label: "My requests", run: () => router.push("/exec/request/submissions") },
        ]}
      />
      <DashboardView
        kpis={kpis}
        trips={trips}
        userName={userName}
        onOpenSchedule={() => router.push("/exec/schedule")}
        onNewRequest={() => router.push("/exec/request")}
      />
    </>
  );
}
