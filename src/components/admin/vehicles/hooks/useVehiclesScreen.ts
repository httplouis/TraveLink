import * as React from "react";
import type { Vehicle, VehicleFilters } from "@/lib/admin/vehicles/types";
import { VehiclesRepo } from "@/lib/admin/vehicles/store";
import type { VehiclePrimaryTab } from "../ui/constants";

export function useVehiclesScreen() {
  const [filters, setFilters] = React.useState<VehicleFilters>({});
  const [rows, setRows] = React.useState<Vehicle[]>([]);
  const [selection, setSelection] = React.useState<string[]>([]);
  const [form, setForm] = React.useState<null | { mode: "create" } | { mode: "edit"; id: string }>(null);

  // new: grid/list, active tab, query
  const [view, setView] = React.useState<"grid" | "table">("grid");
  const [tab, setTab] = React.useState<VehiclePrimaryTab>("all");

  const refresh = React.useCallback(() => {
    let list = VehiclesRepo.listLocal(filters);
    // apply tab logic without leaking into filters UI
    if (tab === "assigned") list = list.filter(v => (v as any).assignedDriver);
    if (tab === "out_of_order") list = list.filter(v => v.status === "inactive");
    if (tab === "available") list = list.filter(v => v.status === "active" && !(v as any).assignedDriver);
    if (tab === "service_needed") {
      list = list.filter(v => {
        const due = (v as any).nextServiceISO as string | undefined;
        if (!due) return false;
        return new Date(due) <= new Date();
      });
    }
    setRows(list);
  }, [filters, tab]);

  React.useEffect(() => { refresh(); }, [refresh]);

  return {
    filters, setFilters,
    rows, setRows,
    selection, setSelection,
    form, setForm,
    view, setView,
    tab, setTab,
    refresh,
  } as const;
}
