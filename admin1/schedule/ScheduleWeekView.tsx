"use client";

import { ScheduleEvent, addMinutes, formatDayKey, startOfWeek } from "@/lib/schedule";
import { useMemo } from "react";

const START_HOUR = 6;
const END_HOUR = 20;
const MIN_PER_HOUR = 60;
const PX_PER_MIN = 1; // 60 min = 60px, full grid height ~ 840px

const MAROON = "#7A0010";

export default function ScheduleWeekView({
  weekAnchor,
  events,
  onSelectEvent,
  onCreateAt,
}: {
  weekAnchor: Date;
  events: ScheduleEvent[];
  onSelectEvent: (e: ScheduleEvent) => void;
  onCreateAt: (d: Date) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(weekAnchor);
    return Array.from({ length: 7 }).map((_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [weekAnchor]);

  const grouped = useMemo(() => {
    const m = new Map<string, ScheduleEvent[]>();
    days.forEach(d => m.set(formatDayKey(d), []));
    events.forEach(e => {
      const k = formatDayKey(new Date(e.start));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    });
    // sort by time
    Array.from(m.values()).forEach(list => list.sort((a,b) => +new Date(a.start) - +new Date(b.start)));
    return m;
  }, [events, days]);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => START_HOUR + i);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-[72px_repeat(7,1fr)]">
        {/* day headers */}
        <div className="bg-neutral-50 border-b border-neutral-200 sticky top-[64px] z-[1]" />
        {days.map((d, idx) => (
          <div
            key={idx}
            className="bg-neutral-50 border-b border-neutral-200 px-3 py-2 sticky top-[64px] z-[1]"
          >
            <div className="text-[11px] text-neutral-500">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
            <div className="font-semibold">{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
          </div>
        ))}

        {/* time gutter */}
        <div className="relative">
          {hours.map((h) => (
            <div key={h} className="h-[60px] border-b border-neutral-100 text-[11px] text-neutral-500 pr-2 text-right">
              <div className="translate-y-[-6px]">{h}:00</div>
            </div>
          ))}
        </div>

        {/* day columns */}
        {days.map((d, idx) => {
          const key = formatDayKey(d);
          const items = grouped.get(key) ?? [];
          return (
            <div
              key={idx}
              className="relative border-l border-neutral-100 bg-[linear-gradient(#f6f6f6_1px,transparent_1px)]"
              style={{ backgroundSize: `100% ${MIN_PER_HOUR * PX_PER_MIN}px` }}
              onDoubleClick={(e) => {
                // create at clicked position
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const y = e.clientY - rect.top;
                const mins = Math.floor(y / PX_PER_MIN) + START_HOUR * 60;
                const dt = new Date(d); dt.setHours(0, mins, 0, 0);
                onCreateAt(dt);
              }}
            >
              {/* events */}
              {items.map((ev) => {
                const s = new Date(ev.start);
                const e = new Date(ev.end);
                const top = ((s.getHours() * 60 + s.getMinutes()) - START_HOUR * 60) * PX_PER_MIN;
                const h = Math.max(30, ((e.getTime() - s.getTime()) / 60000) * PX_PER_MIN);
                const conflictTone = ev.status === "Cancelled" ? "opacity-50" : "";
                return (
                  <button
                    key={ev.id}
                    className={`absolute left-1 right-1 rounded-lg shadow-sm overflow-hidden text-left ${conflictTone}`}
                    style={{ top, height: h, background: "linear-gradient(180deg, rgba(122,0,16,0.92), rgba(122,0,16,0.78))" }}
                    onClick={() => onSelectEvent(ev)}
                  >
                    <div className="px-2 py-1 text-[11px] text-white/90">
                      <div className="font-semibold leading-tight text-white truncate">{ev.title}</div>
                      <div className="opacity-90 truncate">
                        {timeSpanLabel(s, e)} • {ev.campus}
                        {ev.vehicleId ? ` • ${ev.vehicleId}` : ""}
                      </div>
                      <div className="text-white/90 text-[10px]">{ev.status}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 text-[11px] text-neutral-500 border-t">
        Tip: Double-click a day column to create a schedule at that time.
      </div>
    </div>
  );
}

function timeSpanLabel(s: Date, e: Date) {
  const f = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${f(s)}–${f(e)}`;
}
