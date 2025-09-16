"use client";

import { ScheduleEvent, formatDayKey } from "@/lib/schedule";
import { useMemo } from "react";

export default function ScheduleAgendaView({
  events,
  onSelectEvent,
}: {
  events: ScheduleEvent[];
  onSelectEvent: (e: ScheduleEvent) => void;
}) {
  const groups = useMemo(() => {
    const m = new Map<string, ScheduleEvent[]>();
    events.forEach(e => {
      const k = formatDayKey(new Date(e.start));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    });
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {groups.length === 0 && (
        <div className="py-10 text-center text-neutral-500">No items for current filters.</div>
      )}
      {groups.map(([day, list]) => (
        <div key={day} className="border-b last:border-b-0">
          <div className="px-4 py-2 bg-neutral-50 text-sm font-medium">
            {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </div>
          <div className="divide-y">
            {list.sort((a,b) => +new Date(a.start) - +new Date(b.start)).map(ev => (
              <button
                key={ev.id}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 grid md:grid-cols-[160px_1fr_auto] gap-2 items-center"
                onClick={() => onSelectEvent(ev)}
              >
                <div className="text-sm text-neutral-600">{timeSpanLabel(new Date(ev.start), new Date(ev.end))}</div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{ev.title}</div>
                  <div className="text-[12px] text-neutral-600 truncate">
                    {ev.campus} {ev.vehicleId ? `• ${ev.vehicleId}` : ""} {ev.driverId ? `• ${ev.driverId}` : ""}
                  </div>
                </div>
                <span className={`justify-self-end text-xs px-2.5 py-1 rounded-full ${statusTone(ev.status)}`}>{ev.status}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function timeSpanLabel(s: Date, e: Date) {
  const f = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${f(s)}–${f(e)}`;
}
function statusTone(s: string) {
  switch (s) {
    case "Approved": return "bg-emerald-100 text-emerald-700";
    case "En Route": return "bg-blue-100 text-blue-700";
    case "Completed": return "bg-neutral-200 text-neutral-700";
    case "Cancelled": return "bg-rose-100 text-rose-700";
    default: return "bg-amber-100 text-amber-700";
  }
}
