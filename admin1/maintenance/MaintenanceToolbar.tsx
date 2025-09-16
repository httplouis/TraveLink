"use client";

import { CalendarPlus2, KanbanSquare, List } from "lucide-react";

const BRAND = "#7A0010";

export default function MaintenanceToolbar({
  view,
  onView,
  onNew,
}: {
  view: "table" | "board";
  onView: (v: "table" | "board") => void;
  onNew: () => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 md:px-4 md:py-3 shadow-sm flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <span className="text-sm font-medium">Maintenance</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-1">
          <button
            onClick={() => onView("table")}
            className={`px-3 py-1.5 rounded-md text-sm ${view === "table" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}
            title="Table view"
          >
            <List className="w-4 h-4 inline mr-1" /> Table
          </button>
          <button
            onClick={() => onView("board")}
            className={`px-3 py-1.5 rounded-md text-sm ${view === "board" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}
            title="Board view"
          >
            <KanbanSquare className="w-4 h-4 inline mr-1" /> Board
          </button>
        </div>

        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-white shadow-sm"
          style={{ background: BRAND }}
        >
          <CalendarPlus2 className="w-4 h-4" />
          <span className="text-sm font-medium">New ticket</span>
        </button>
      </div>
    </div>
  );
}
