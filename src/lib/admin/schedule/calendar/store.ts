"use client";

import { create } from "zustand";
import { AdminSchedule, CalendarFilters } from "./types";
import { startOfMonthISO } from "./date";

type CalendarState = {
  schedules: AdminSchedule[];
  capacityPerDay: number;
  filters: CalendarFilters;
  setMonth: (iso: string) => void;
  setStatus: (s: CalendarFilters["status"]) => void;
  setVehicle: (id: CalendarFilters["vehicleId"]) => void;
  setQuery: (q: string) => void;
  setSchedules: (rows: AdminSchedule[]) => void;
  setCapacity: (n: number) => void;
};

function tryLoadFromLocal(): AdminSchedule[] {
  if (typeof window === "undefined") return [];
  const keys = [
    "ScheduleRepo:schedules",
    "travilink:schedules",
    "travilink-admin:schedules",
  ];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch {}
  }
  return [];
}

const todayAnchor = startOfMonthISO(new Date());

export const useScheduleCalendar = create<CalendarState>((set) => ({
  schedules: [],
  capacityPerDay: 5,
  filters: { status: "all", vehicleId: "all", query: "", monthAnchor: todayAnchor },
  setMonth: (iso) => set((s) => ({ filters: { ...s.filters, monthAnchor: iso } })),
  setStatus: (status) => set((s) => ({ filters: { ...s.filters, status } })),
  setVehicle: (vehicleId) => set((s) => ({ filters: { ...s.filters, vehicleId } })),
  setQuery: (query) => set((s) => ({ filters: { ...s.filters, query } })),
  setSchedules: (rows) => set({ schedules: rows }),
  setCapacity: (n) => set({ capacityPerDay: n }),
}));

// seed from localStorage on first load (non-fatal if empty)
export function initCalendarDataOnce() {
  if (typeof window === "undefined") return;
  const rows = tryLoadFromLocal();
  if (rows.length) {
    useScheduleCalendar.getState().setSchedules(rows);
  }
}
