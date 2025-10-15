"use client";

import { useRouter } from "next/navigation";
import DashboardView from "./DashboardView";
import type { Trip } from "@/lib/user/schedule/types";
import { MOCK_TRIPS } from "@/lib/user/schedule/mock"; // swap to real fetch later

const KPIS = [
  { label: "Active Requests", value: 5 },
  { label: "Vehicles Online", value: 3 },
  { label: "Pending Approvals", value: 4 },
];

export default function DashboardContainer() {
  const router = useRouter();
  const trips: Trip[] = MOCK_TRIPS;

  return (
    <DashboardView
      kpis={KPIS}
      trips={trips}
      userName="Jose"
      onOpenSchedule={() => router.push("/user/schedule")}
      onNewRequest={() => router.push("/user/request")}
    />
  );
}
