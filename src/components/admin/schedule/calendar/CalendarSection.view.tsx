"use client";

import TopFilters from "./TopFilters.ui";
import MonthHeader from "./MonthHeader.ui";
import CalendarGrid from "./CalendarGrid.view";

export default function CalendarSection() {
  return (
    <div className="mt-2">
      {/* Top toolbar: Status / Vehicle / Search / Date */}
      <TopFilters />

      {/* Card with month header + grid (clean look like the reference) */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <MonthHeader />
        <CalendarGrid />
      </section>
    </div>
  );
}
