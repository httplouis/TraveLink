"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import DashboardView from "./DashboardView";
import CommandPalette from "@/components/common/CommandPalette";
import type { Trip } from "@/lib/user/schedule/types";
import { MOCK_TRIPS } from "@/lib/user/schedule/mock";

const KPIS = [
  { label: "Active Requests", value: 5 },
  { label: "Vehicles Online", value: 3 },
  { label: "Pending Approvals", value: 4 },
];

export default function DashboardContainer() {
  const router = useRouter();
  const trips: Trip[] = MOCK_TRIPS;
  const [vehicles, setVehicles] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Fetch available vehicles for dashboard showcase
    fetch('/api/vehicles?status=available')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setVehicles(data.data || []);
        }
      })
      .catch(err => console.error('Failed to fetch vehicles:', err));
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
        kpis={KPIS}
        trips={trips}
        vehicles={vehicles}
        userName="Jose"
        onOpenSchedule={() => router.push("/user/schedule")}
        onNewRequest={() => router.push("/user/request")}
      />
    </>
  );
}
