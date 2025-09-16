"use client";

import { addDays, endOfWeek, startOfWeek } from "@/lib/schedule";
import { CalendarDays, ChevronLeft, ChevronRight, PlusCircle, Table } from "lucide-react";

const MAROON = "#7A0010";

export default function ScheduleToolbar({
  weekAnchor,
  onWeekChange,
  view,
  onView,
  onNew,
}: {
  weekAnchor: Date;
  onWeekChange: (next: Date) => void;
  view: "week" | "agenda";
  onView: (v: "week" | "agenda") => void;
  onNew: () => void;
}) {
  const start = startOfWeek(weekAnchor);
  const end = endOfWeek(weekAnchor);
  const label = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} — ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 md:px-4 md:py-3 shadow-sm flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-md border hover:bg-neutral-50" onClick={() => onWeekChange(addDays(weekAnchor, -7))} aria-label="Prev week">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-md border hover:bg-neutral-50" onClick={() => onWeekChange(new Date())}>
          Today
        </button>
        <button className="p-2 rounded-md border hover:bg-neutral-50" onClick={() => onWeekChange(addDays(weekAnchor, 7))} aria-label="Next week">
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="ml-2 inline-flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <CalendarDays className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-1">
          <button
            onClick={() => onView("week")}
            className={`px-3 py-1.5 rounded-md text-sm ${view === "week" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}
            title="Week view"
          >
            <Table className="w-4 h-4 inline mr-1" /> Week
          </button>
          <button
            onClick={() => onView("agenda")}
            className={`px-3 py-1.5 rounded-md text-sm ${view === "agenda" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}
            title="Agenda view"
          >
            Agenda
          </button>
        </div>

        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-white shadow-sm"
          style={{ background: MAROON }}
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-sm font-medium">New schedule</span>
        </button>
      </div>
    </div>
  );
}
