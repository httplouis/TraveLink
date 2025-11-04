"use client";

import { useRouter } from "next/navigation";
import DashboardView from "@/components/user/dashboard/DashboardView";
import CommandPalette from "@/components/common/CommandPalette";
import { useEffect, useState } from "react";
import type { Trip } from "@/lib/user/schedule/types";

export default function HRDashboardContainer() {
  const router = useRouter();
  const [kpis, setKpis] = useState([
    { label: "HR Pending", value: 0 },
    { label: "Active Requests", value: 0 },
    { label: "Processed Today", value: 0 },
  ]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userName, setUserName] = useState("HR");

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (data.full_name) setUserName(data.full_name.split(" ")[0]);
      });

    fetch("/api/hr/stats")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setKpis([
            { label: "HR Pending", value: data.pending_count || 0 },
            { label: "Active Requests", value: data.active_count || 0 },
            { label: "Processed Today", value: data.processed_today || 0 },
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
          { id: "inbox", label: "HR inbox", shortcut: "I", run: () => router.push("/hr/inbox") },
          { id: "new", label: "New request", shortcut: "N", run: () => router.push("/hr/request") },
          { id: "schedule", label: "Open schedule", shortcut: "S", run: () => router.push("/hr/schedule") },
          { id: "mine", label: "My requests", run: () => router.push("/hr/request/submissions") },
        ]}
      />
      <DashboardView
        kpis={kpis}
        trips={trips}
        userName={userName}
        onOpenSchedule={() => router.push("/hr/schedule")}
        onNewRequest={() => router.push("/hr/request")}
      />
    </>
  );
}
