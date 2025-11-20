"use client";

import MiniCalendarWidget from "@/components/user/calendar/MiniCalendarWidget.ui";
import UpcomingList from "@/components/user/calendar/UpcomingList.ui"; // from the schedule split
import type { Trip } from "@/lib/user/schedule/types";
import { CheckCircle2, Download, FileText, Calendar, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

type KPI = { label: string; value: number | string; sub?: string };
type ApprovedRequest = {
  id: string;
  request_number: string;
  file_code?: string;
  destination: string;
  purpose?: string;
  travel_start_date?: string;
  travel_end_date?: string;
  total_budget?: number;
  president_approved_at?: string;
  final_approved_at?: string;
  department?: { code: string; name: string } | null;
};

type Props = {
  kpis: KPI[];
  trips: Trip[];
  onOpenSchedule?: () => void;
  approvedRequests?: ApprovedRequest[];
};

export default function DashboardView({ kpis, trips, onOpenSchedule, approvedRequests = [] }: Props) {
  const router = useRouter();
  
  // take the next few trips for the dashboard list
  const now = new Date();
  const upcoming = [...trips]
    .filter(t => new Date(t.start) >= now)
    .sort((a,b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 6);

  const handleDownloadPDF = (requestId: string, requestNumber: string) => {
    window.open(`/api/requests/${requestId}/pdf`, '_blank');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₱0.00";
    return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{k.value}</div>
            {k.sub ? <div className="text-xs text-gray-500">{k.sub}</div> : null}
          </div>
        ))}
      </div>

      {/* Approved Requests Section - Prominent */}
      {approvedRequests && approvedRequests.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Recently Approved Requests</h2>
            </div>
            <button
              onClick={() => router.push('/user/submissions')}
              className="text-sm font-medium text-green-700 hover:text-green-800 underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {approvedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-green-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                        {req.request_number || req.file_code || "—"}
                      </span>
                      <span className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                      {req.purpose || "Travel Request"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-2">
                      {req.destination && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{req.destination}</span>
                        </div>
                      )}
                      {req.travel_start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(req.travel_start_date)}</span>
                        </div>
                      )}
                      {req.total_budget && req.total_budget > 0 && (
                        <span className="font-medium text-gray-900">{formatCurrency(req.total_budget)}</span>
                      )}
                    </div>
                    {(req.president_approved_at || req.final_approved_at) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Approved on {formatDate(req.president_approved_at || req.final_approved_at)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(req.id, req.request_number)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7A0010] hover:bg-[#5e000d] text-white rounded-lg transition-colors text-sm font-medium shadow-sm flex-shrink-0"
                    title="Download Travel Order PDF"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left: mini calendar */}
        <div className="xl:col-span-1">
          <MiniCalendarWidget
            trips={trips}
            onOpenSchedule={onOpenSchedule}
            title="Next requests"
            maxItems={6}
          />
        </div>

        {/* Right: upcoming + approvals */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-900">Upcoming (next 6)</div>
            <UpcomingList trips={upcoming} />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-900">Pending approvals</div>
            {/* TODO: replace with your approvals list component */}
            <p className="text-sm text-gray-500">No pending approvals.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
