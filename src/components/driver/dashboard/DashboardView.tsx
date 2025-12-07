"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Clock, Star, MessageSquare } from "lucide-react";
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
  metrics, upcoming, actions, fleet, feedbackSummary,
}:{
  metrics: Metrics;
  upcoming: UpcomingRow[];
  actions: Array<{ icon: React.ReactNode; title: string; desc: string; href: string }>;
  fleet?: FleetVehicle[];
  feedbackSummary?: {
    total: number;
    averageRating: string;
    recentFeedback: Array<{ rating: number; message: string; userName: string; date: string }>;
  } | null;
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

      {/* Upcoming Trips */}
      {upcoming.length > 0 && (
        <div className="mt-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Trips</h2>
            <div className="space-y-3">
              {upcoming.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-[#7a0019]" />
                      <div>
                        <p className="font-medium text-gray-900">{trip.location}</p>
                        <p className="text-sm text-gray-600">{trip.date}</p>
                        <p className="text-xs text-gray-500">{trip.vehicle}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Summary */}
      {feedbackSummary && feedbackSummary.total > 0 && (
        <div className="mt-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Feedback Summary</h2>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold text-gray-900">{feedbackSummary.averageRating}</span>
                <span className="text-sm text-gray-500">({feedbackSummary.total} reviews)</span>
              </div>
            </div>
            
            {feedbackSummary.recentFeedback.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-3">Recent Feedback:</p>
                {feedbackSummary.recentFeedback.map((feedback, idx) => (
                  <div key={idx} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= feedback.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {feedback.userName || "Anonymous"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{feedback.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
