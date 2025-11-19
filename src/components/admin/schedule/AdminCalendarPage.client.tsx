// src/components/admin/schedule/AdminCalendarPage.client.tsx
"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { AdminCalendarDetailsModal } from "./ui/AdminCalendarDetailsModal.ui";

// Calendar is client-only to avoid hydration mismatch
const MonthCalendar = dynamic(() => import("./ui/AdminMonthCalendar.ui"), {
  ssr: false,
});

type CalendarRequest = {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  destination: string;
  status: string;
  requester_name: string;
  department: string;
  department_id: string;
  vehicle: {
    id: string;
    name: string;
    type: string;
    plate_number: string;
    capacity: number;
  };
  driver: {
    id: string;
    name: string;
    email: string;
  };
  travel_start_date: string;
  travel_end_date: string;
  participants: any;
  total_budget: number;
  created_at: string;
  updated_at: string;
  admin_processed_at: string;
};

type CalendarData = Record<string, {
  total: number;
  available: number;
  requests: CalendarRequest[];
}>;

export default function AdminCalendarPageClient() {
  const [month, setMonth] = React.useState<number>(new Date().getMonth());
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [calendarData, setCalendarData] = React.useState<CalendarData>({});
  const [selectedISO, setSelectedISO] = React.useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = React.useState<CalendarRequest[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Fetch calendar data
  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule/admin-calendar?month=${month}&year=${year}`, {
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[AdminCalendar] HTTP error:", response.status, errorText);
        setCalendarData({});
        return;
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[AdminCalendar] Non-JSON response:", text.substring(0, 200));
        setCalendarData({});
        return;
      }
      
      const result = await response.json();
      console.log("[AdminCalendar] API response:", { ok: result.ok, hasData: !!result.data, keys: Object.keys(result) });

      if (result.ok && result.data) {
        setCalendarData(result.data);
      } else {
        console.error("[AdminCalendar] API error:", result.error || "Unknown error", "Full result:", JSON.stringify(result, null, 2));
        setCalendarData({});
      }
    } catch (error) {
      console.error("[AdminCalendar] Fetch error:", error);
      setCalendarData({});
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time updates: Poll every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 10000);

    return () => clearInterval(interval);
  }, [refresh]);

  // Open date details
  const openDate = React.useCallback((iso: string) => {
    setSelectedISO(iso);
    const requests = calendarData[iso]?.requests || [];
    setSelectedRequests(requests);
    setModalOpen(true);
  }, [calendarData]);

  // Month navigation
  const onPrev = React.useCallback(() => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  }, [month, year]);

  const onNext = React.useCallback(() => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  }, [month, year]);

  // Build availability map for calendar display
  const availability = React.useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(calendarData).forEach(([iso, data]) => {
      map[iso] = data.total;
    });
    return map;
  }, [calendarData]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 bg-neutral-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#7a1f2a]"></div>
          <p className="mt-2 text-neutral-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Schedule Calendar</h1>
          <p className="text-sm text-neutral-500">
            View and manage all approved requests. Click a date to view details.
          </p>
        </div>
      </header>

      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-md shadow-black/5">
        <div className="p-4 pt-2">
          <MonthCalendar
            month={month}
            year={year}
            availability={availability}
            calendarData={calendarData}
            onPrev={onPrev}
            onNext={onNext}
            onSelectDate={openDate}
            selectedISO={selectedISO}
          />
        </div>
      </div>

      {/* Modal: shows all requests for selected day with full details */}
      <AdminCalendarDetailsModal
        open={modalOpen}
        dateISO={selectedISO}
        requests={selectedRequests}
        onClose={() => setModalOpen(false)}
        onRefresh={refresh}
      />
    </section>
  );
}

