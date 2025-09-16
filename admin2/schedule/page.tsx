"use client";

import { useMemo, useState } from "react";
import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import ScheduleToolbar from "@/components/admin/schedule/ScheduleToolbar";
import ScheduleFilters from "@/components/admin/schedule/ScheduleFilters";
import ScheduleWeekView from "@/components/admin/schedule/ScheduleWeekView";
import ScheduleAgendaView from "@/components/admin/schedule/ScheduleAgendaView";
import ScheduleEventDrawer from "@/components/admin/schedule/ScheduleEventDrawer";
import ScheduleFormModal, { ScheduleFormValues } from "@/components/admin/schedule/ScheduleFormModal";
import ScheduleStats from "@/components/admin/schedule/ScheduleStats";
import {
  Driver,
  ScheduleEvent,
  ScheduleQuery,
  Vehicle,
  addMinutes,
  endOfWeek,
  filterSchedule,
  seedDrivers,
  seedSchedule,
  seedVehicles,
  startOfWeek,
} from "@/lib/schedule";
import { Loader2 } from "lucide-react";

const PAGE_BRAND = "#7A0010";
const PAGE_SIZE = 9999; // not used; week view shows all

export default function AdminSchedulePage() {
  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date());
  const [view, setView] = useState<"week" | "agenda">("week");
  const [vehicles] = useState<Vehicle[]>(() => seedVehicles(16));
  const [drivers]  = useState<Driver[]>(() => seedDrivers(18));
  const [events, setEvents] = useState<ScheduleEvent[]>(() => seedSchedule(vehicles, drivers, 40));

  const [query, setQuery] = useState<ScheduleQuery>({});
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState<ScheduleEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Partial<ScheduleFormValues> | undefined>(undefined);

  const weekRange = { from: startOfWeek(weekAnchor).toISOString(), to: endOfWeek(weekAnchor).toISOString() };

  const filtered = useMemo(() => {
    // Default filter to the shown week if none provided
    const q = { ...{ from: weekRange.from, to: weekRange.to }, ...query };
    return filterSchedule(events, q, vehicles, drivers);
  }, [events, query, weekAnchor, vehicles, drivers]);

  const stats = useMemo(() => {
    const w = filtered.length;
    return [
      { label: "Events (this week)", value: w },
      { label: "Approved", value: filtered.filter(e => e.status === "Approved").length },
      { label: "Completed", value: filtered.filter(e => e.status === "Completed").length },
    ];
  }, [filtered]);

  const onFilter = (q: ScheduleQuery) => {
    setLoading(true);
    setQuery(q);
    setTimeout(() => setLoading(false), 180);
  };

  const onNew = (initial?: Partial<ScheduleFormValues>) => {
    setFormInitial(initial);
    setFormOpen(true);
  };

  const createFromForm = (v: ScheduleFormValues) => {
    const start = new Date(`${v.date}T${v.startTime}:00`);
    const end   = new Date(`${v.date}T${v.endTime}:00`);
    const ev: ScheduleEvent = {
      id: `EV-${Math.floor(Math.random()*1e6)}`,
      title: v.title,
      campus: v.campus,
      start: start.toISOString(),
      end: end.toISOString(),
      passengers: v.passengers,
      status: "Scheduled",
      vehicleId: v.vehicleId || undefined,
      driverId: v.driverId || undefined,
      notes: v.notes,
    };
    setEvents((arr) => [...arr, ev].sort((a,b) => +new Date(a.start) - +new Date(b.start)));
    setFormOpen(false);
  };

  const onStatus = (id: string, s: ScheduleEvent["status"]) => {
    setEvents((arr) => arr.map(e => e.id === id ? { ...e, status: s } : e));
    setDrawer((d) => d && d.id === id ? { ...d, status: s } : d);
  };

  const onAssign = (id: string, updates: Partial<ScheduleEvent>) => {
    setEvents((arr) => arr.map(e => e.id === id ? { ...e, ...updates } : e));
    setDrawer((d) => d && d.id === id ? { ...d, ...updates } : d);
  };

  const onDelete = (id: string) => {
    setEvents((arr) => arr.filter(e => e.id !== id));
    setDrawer(null);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white" style={{ background: PAGE_BRAND }}>
              S
            </div>
            <h1 className="text-base sm:text-lg font-semibold">Admin Schedule</h1>
            <p className="text-sm text-neutral-500 hidden md:block truncate">Plan, assign, and track trips across campuses.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 grid grid-cols-12 gap-4 md:gap-5">
        <AdminLeftNav />

        <section className="col-span-12 md:col-span-9 xl:col-span-9 grid gap-4 md:gap-5 min-w-0">
          <ScheduleStats stats={stats} />

          <ScheduleToolbar
            weekAnchor={weekAnchor}
            onWeekChange={setWeekAnchor}
            view={view}
            onView={setView}
            onNew={() => onNew()}
          />

          <ScheduleFilters
            total={events.length}
            showing={filtered.length}
            query={query}
            onChange={onFilter}
          />

          <div className="min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
              </div>
            ) : view === "week" ? (
              <ScheduleWeekView
                weekAnchor={weekAnchor}
                events={filtered}
                onSelectEvent={setDrawer}
                onCreateAt={(dt) => {
                  onNew({
                    date: dt.toISOString().slice(0,10),
                    startTime: dt.toTimeString().slice(0,5),
                    endTime: addMinutes(dt, 90).toTimeString().slice(0,5),
                  });
                }}
              />
            ) : (
              <ScheduleAgendaView
                events={filtered}
                onSelectEvent={setDrawer}
              />
            )}
          </div>
        </section>
      </main>

      <ScheduleEventDrawer
        row={drawer}
        events={events}
        vehicles={vehicles}
        drivers={drivers}
        onClose={() => setDrawer(null)}
        onStatus={onStatus}
        onAssign={onAssign}
        onDelete={onDelete}
      />

      <ScheduleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={createFromForm}
        vehicles={vehicles}
        drivers={drivers}
        initial={formInitial}
      />
    </div>
  );
}
