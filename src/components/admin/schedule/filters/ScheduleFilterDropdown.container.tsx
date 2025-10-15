"use client";
import * as React from "react";
import ScheduleFilterDropdownUI, {
  DriverOption,
  VehicleOption,
} from "./ScheduleFilterDropdown.ui";
import type { ScheduleFilterState } from "@/lib/admin/schedule/filters";
import { ScheduleRepo } from "@/lib/admin/schedule/store";

export default function ScheduleFilterDropdown({
  draft,
  onDraftChange,
  onApply,
  onClearAll,
}: {
  draft: ScheduleFilterState;
  onDraftChange: (n: Partial<ScheduleFilterState>) => void;
  onApply: () => void;
  onClearAll: () => void;
}) {
  // Build options here (decoupled from UI)
  const drivers: DriverOption[] = (ScheduleRepo.constants?.drivers ?? []).map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const vehicles: VehicleOption[] = (ScheduleRepo.constants?.vehicles ?? []).map((v) => ({
    id: v.id,
    label: v.label,
    plateNo: v.plateNo,
  }));

  return (
    <ScheduleFilterDropdownUI
      draft={draft}
      onDraftChange={onDraftChange}
      onApply={onApply}
      onClearAll={onClearAll}
      drivers={drivers}
      vehicles={vehicles}
    />
  );
}
