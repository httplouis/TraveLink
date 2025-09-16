"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Clock } from "lucide-react";
import { FleetSnapshot, type FleetVehicle } from "@/components/driver/FleetSnapshot"; // ✅ named import

export type Status = "Pending" | "Approved" | "Assigned";

export type UpcomingRow = {
  id: string;
  date: string;      // "YYYY-MM-DD HH:mm"
  location: string;
  vehicle: string;
  status: Status;
};

export type Metrics = { trips: number; online: number; pending: number };

const tone = (s: Status) =>
  s === "Approved" ? "bg-green-100 text-green-700"
  : s === "Pending" ? "bg-amber-100 text-amber-700"
  : "bg-blue-100 text-blue-700";

function ActionCard({ icon, title, desc, href }:{
  icon: React.ReactNode; title: string; desc: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#7a0019] hover:shadow-md"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[#7a0019] transition-transform duration-300 group-hover:scale-x-100" />
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-lg bg-[#7a0019]">
        <div className="text-white">{icon}</div>
      </div>
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-neutral-600">{desc}</p>
      <div className="mt-3 flex items-center gap-1 text-[#7a0019]">
        <span className="text-sm">More</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function MetricCard({ icon, label, value }:{
  icon: React.ReactNode; label: string; value: number | string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/70">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#7a0019]/10 text-[#7a0019]">
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

const SHOW_SNAPSHOT = true;

export default function DashboardView({
  metrics, upcoming, actions, fleet,
}:{
  metrics: Metrics;
  upcoming: UpcomingRow[];
  actions: Array<{ icon: React.ReactNode; title: string; desc: string; href: string }>;
  fleet?: FleetVehicle[];
}) {
  const cleanActions = actions.filter((a) => {
    const t = a.title?.toLowerCase?.() ?? "";
    return !(a.href?.startsWith?.("/driver/maintenance")) && !t.includes("maintenance");
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Driver Transport Portal</h1>
          <p className="text-sm text-neutral-600">See upcoming trips and update your status.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/driver/status" className="btn btn-primary">Update Status</Link>
          <Link href="/driver/schedule" className="btn btn-outline">View Schedule</Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={<CalendarDays className="h-5 w-5" />} label="Trips"   value={metrics.trips} />
        <MetricCard icon={<Users className="h-5 w-5" />}       label="Online"  value={metrics.online} />
        <MetricCard icon={<Clock className="h-5 w-5" />}       label="Pending" value={metrics.pending} />
      </div>

      {/* Actions */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cleanActions.map((a) => (
          <ActionCard key={`${a.title}-${a.href}`} {...a} />
        ))}
      </div>

      {/* Fleet Snapshot */}
      {SHOW_SNAPSHOT && fleet && fleet.length > 0 && (
        <div className="mt-6">
          <FleetSnapshot title="Fleet Snapshot (Read Only)" vehicles={fleet} />
        </div>
      )}

      {/* Upcoming + Quick note */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ... unchanged ... */}
      </div>
    </div>
  );
}
