"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardView from "./DashboardView";
import type { Trip } from "@/lib/user/schedule/types";

export default function DashboardContainer() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's trips from API
    const fetchTrips = async () => {
      try {
        const response = await fetch('/api/trips/my-trips');
        const result = await response.json();
        
        if (result.ok && result.data) {
          // Transform bookings to Trip format
          const tripData: Trip[] = result.data.map((booking: any) => ({
            id: booking.id,
            dateISO: booking.dateISO,
            vehicle: booking.vehicle || "Van",
            driver: booking.driver || "TBD",
            department: booking.department || "",
            destination: booking.destination || "",
            purpose: booking.purpose || "",
            departAt: booking.time || "",
            returnAt: "",
            status: booking.status || "pending",
          }));
          setTrips(tripData);
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch trips:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Fetch KPIs from API
  const [kpis, setKpis] = useState([
    { label: "Active Requests", value: 0 },
    { label: "Vehicles Online", value: 0 },
    { label: "Pending Approvals", value: 0 },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/dashboard/stats');
        const result = await response.json();
        
        if (result.ok && result.data) {
          setKpis([
            { label: "Active Requests", value: result.data.activeRequests || 0 },
            { label: "Vehicles Online", value: result.data.vehiclesOnline || 0 },
            { label: "Pending Approvals", value: result.data.pendingApprovals || 0 },
          ]);
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Fetch user name
  const [userName, setUserName] = useState("User");
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const result = await response.json();
        
        if (result.ok && result.data?.name) {
          const { getFirstName } = await import('@/lib/utils/name-formatting');
          const firstName = getFirstName(result.data.name);
          setUserName(firstName);
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <DashboardView
      kpis={kpis}
      trips={trips}
      userName={userName}
      onOpenSchedule={() => router.push("/user/schedule")}
      onNewRequest={() => router.push("/user/request")}
    />
  );
}
