// src/components/user/schedule/UserSchedulePage.client.tsx
"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { FiltersBar } from "./parts/FiltersBar.ui";
// Calendar is client-only to avoid hydration mismatch from extensions/locale attrs
const MonthCalendar = dynamic(() => import("./parts/MonthCalendar.ui"), {
  ssr: false,
});
import DateDetailsModal from "./parts/DateDetailsModal.ui";

import {
  UserScheduleRepo,
  type AvailabilityMap,
} from "@/lib/user/schedule/repo";
import type { UserCalFilters, Booking } from "@/lib/user/schedule/types";

export default function UserSchedulePage() {
  const [month, setMonth] = React.useState<number>(new Date().getMonth());
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [filters, setFilters] = React.useState<UserCalFilters>({
    status: "All",
    vehicle: "All",
    q: "",
    jumpTo: null,
  });

  const [availability, setAvailability] = React.useState<AvailabilityMap>({});
  const [availabilityWithStatus, setAvailabilityWithStatus] = React.useState<import("@/lib/user/schedule/repo").AvailabilityWithStatus>({});
  const [selectedISO, setSelectedISO] = React.useState<string | null>(null);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isPublicUser, setIsPublicUser] = React.useState(true); // Default to public mode

  // Check user role to determine if they should see public mode
  React.useEffect(() => {
    async function checkUserRole() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data) {
            const user = data.data;
            // Public mode for regular users (not admin, head, comptroller, hr, vp, president)
            const isPrivileged = user.is_admin || user.is_head || user.is_comptroller || user.is_hr || user.is_executive;
            setIsPublicUser(!isPrivileged);
          }
        }
      } catch (err) {
        console.error("[UserSchedulePage] Error checking user role:", err);
        // Default to public mode on error
        setIsPublicUser(true);
      }
    }
    checkUserRole();
  }, []);

  // fetch availability for visible month with status
  const refresh = React.useCallback(async () => {
    try {
      // Get basic availability map
      const basicAvailability = await UserScheduleRepo.list({
        month,
        year,
        vehicle: filters.vehicle,
        q: filters.q,
      });
      setAvailability(basicAvailability);

      // Get detailed availability with status
      const detailedAvailability = await UserScheduleRepo.listWithStatus({
        month,
        year,
        vehicle: filters.vehicle,
        q: filters.q,
      });
      setAvailabilityWithStatus(detailedAvailability);
    } catch (error) {
      console.error("[Schedule] Refresh error:", error);
    }
  }, [month, year, filters.vehicle, filters.q]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time updates: Poll every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  // === ALL dates of the visible month (do NOT skip available/empty days) ===
  const monthDatesAll = React.useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mm = String(month + 1).padStart(2, "0");
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dd = String(i + 1).padStart(2, "0");
      return `${year}-${mm}-${dd}`; // YYYY-MM-DD
    });
  }, [month, year]);

  // deterministic label (no locale drift during hydration)
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function fmt(dateISO: string | null) {
    if (!dateISO) return "";
    const d = new Date(dateISO);
    return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}`;
  }

  // open modal for a date
  async function openDate(iso: string) {
    setSelectedISO(iso);
    const items = await UserScheduleRepo.getBookings(iso, {
      vehicle: filters.vehicle,
      q: filters.q,
    });
    setBookings(items);
    setModalOpen(true);
  }

  // compute prev/next targets & position (walk every day; wrap within month)
  const { prevISO, nextISO, pos } = React.useMemo(() => {
    if (!selectedISO || monthDatesAll.length === 0)
      return { prevISO: null as string | null, nextISO: null as string | null, pos: null as any };
    const idx = monthDatesAll.indexOf(selectedISO);
    if (idx === -1)
      return { prevISO: null as string | null, nextISO: null as string | null, pos: null as any };
    const prev = monthDatesAll[(idx - 1 + monthDatesAll.length) % monthDatesAll.length];
    const next = monthDatesAll[(idx + 1) % monthDatesAll.length];
    return { prevISO: prev, nextISO: next, pos: { index: idx, total: monthDatesAll.length } };
  }, [selectedISO, monthDatesAll]);

  const prevDate = React.useCallback(() => { if (prevISO) openDate(prevISO); }, [prevISO]);
  const nextDate = React.useCallback(() => { if (nextISO) openDate(nextISO); }, [nextISO]);

  // close modal if selected date falls outside current month (user paged month)
  React.useEffect(() => {
    if (!selectedISO) return;
    if (monthDatesAll.indexOf(selectedISO) === -1) setModalOpen(false);
  }, [monthDatesAll, selectedISO]);

  // Jump to date (optional)
  React.useEffect(() => {
    if (!filters.jumpTo) return;
    const [y, m] = filters.jumpTo.split("-").map((s) => parseInt(s, 10));
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      setYear(y);
      setMonth(m - 1);
      openDate(filters.jumpTo);
    }
  }, [filters.jumpTo]);

  // month pagination
  const onPrev = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };
  const onNext = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };

  // filtered map only colors days; navigation is unaffected
  const filtered: AvailabilityMap = React.useMemo(() => {
    if (filters.status === "All") return availability;
    const out: AvailabilityMap = {};
    Object.entries(availability).forEach(([iso, count]) => {
      if (filters.status === "Full" && count >= 5) out[iso] = count;
      else if (filters.status === "Available" && count === 0) out[iso] = count;
      else if (filters.status === "Partial" && count > 0 && count < 5) out[iso] = count;
    });
    return out;
  }, [availability, filters.status]);

  return (
    <section className="space-y-4">
      <header className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="text-sm text-neutral-500">
            Click a date to view reservations. Read-only.
          </p>
        </div>
              </header>

      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-md shadow-black/5">
        <FiltersBar
          value={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        />
        <div className="p-4 pt-2">
          <MonthCalendar
            month={month}
            year={year}
            availability={filtered}
            availabilityWithStatus={availabilityWithStatus}
            onPrev={onPrev}
            onNext={onNext}
            onSelectDate={openDate}
            selectedISO={selectedISO}
          />
        </div>
      </div>

      {/* Modal: shows all reservations for selected day + date-to-date nav */}
      <DateDetailsModal
        open={modalOpen}
        dateISO={selectedISO}
        bookings={bookings ?? []}
        onClose={() => setModalOpen(false)}
        onPrevDate={prevDate}
        onNextDate={nextDate}
        pos={pos}
        prevLabel={fmt(prevISO)}
        nextLabel={fmt(nextISO)}
        publicMode={isPublicUser}
      />
    </section>
  );
}
