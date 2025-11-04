"use client";

import { useRouter } from "next/navigation";
import DashboardView from "@/components/user/dashboard/DashboardView";
import CommandPalette from "@/components/common/CommandPalette";
import { useEffect, useState } from "react";
import type { Trip } from "@/lib/user/schedule/types";

export default function HeadDashboardContainer() {
  const router = useRouter();
  const [kpis, setKpis] = useState([
    { label: "Pending Endorsements", value: 0 },
    { label: "Active Requests", value: 0 },
    { label: "My Department", value: "—" },
  ]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userName, setUserName] = useState("Head");

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (data.full_name) setUserName(data.full_name.split(" ")[0]);
        setKpis(prev => [
          prev[0],
          prev[1],
          { label: "My Department", value: data.department || "—" }
        ]);
      });

    fetch("/api/head/stats")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setKpis(prev => [
            { label: "Pending Endorsements", value: data.pending_count || 0 },
            { label: "Active Requests", value: data.active_count || 0 },
            prev[2]
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
          { id: "inbox", label: "Head inbox", shortcut: "I", run: () => router.push("/head/inbox") },
          { id: "new", label: "New request", shortcut: "N", run: () => router.push("/head/request") },
          { id: "schedule", label: "Open schedule", shortcut: "S", run: () => router.push("/head/schedule") },
          { id: "mine", label: "My requests", run: () => router.push("/head/request/submissions") },
        ]}
      />
      <DashboardView
        kpis={kpis}
        trips={trips}
        userName={userName}
        onOpenSchedule={() => router.push("/head/schedule")}
        onNewRequest={() => router.push("/head/request")}
      />
    </>
  );
}
