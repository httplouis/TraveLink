"use client";
import * as React from "react";
import type { Driver, DriverFilters, DriverTab } from "@/lib/admin/drivers/types";
import { DriversRepo } from "@/lib/admin/drivers/store";

type FormState =
  | null
  | { mode: "create" }
  | { mode: "edit"; id: string };

type ViewMode = "grid" | "table";

/** Central page state for Drivers: filters, view, tab, selection, rows */
export function useDriversScreen() {
  const [filters, setFilters] = React.useState<DriverFilters>({});
  const [tab, setTab] = React.useState<DriverTab>("all");
  const [view, setView] = React.useState<ViewMode>("grid");
  const [selection, setSelection] = React.useState<string[]>([]);
  const [form, setForm] = React.useState<FormState>(null);

  const [rows, setRows] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from Supabase API
      await DriversRepo.list(filters);
      const base = DriversRepo.listLocal(filters);
      setRows(applyTab(base, tab));
    } catch (error) {
      console.error('[useDriversScreen] Error fetching drivers:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters, tab]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    filters,
    setFilters,
    tab,
    setTab,
    view,
    setView,
    selection,
    setSelection,
    form,
    setForm,
    rows,
    refresh,
  };
}

function applyTab(base: Driver[], tab: DriverTab) {
  if (tab === "all") return base;
  const todayISO = new Date().toISOString().slice(0, 10);
  switch (tab) {
    case "available":
      return base.filter((d) => d.status === "active" && !d.assignedVehicleId);
    case "on_trip":
      return base.filter((d) => d.status === "on_trip");
    case "off_duty":
      return base.filter((d) => d.status === "off_duty");
    case "suspended":
      return base.filter((d) => d.status === "suspended");
    case "expired_license":
      return base.filter((d) => (d.licenseExpiryISO ?? "") < todayISO);
    default:
      return base;
  }
}
