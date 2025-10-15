// src/components/admin/schedule/ui/ScheduleTable.ui.tsx
// CONTAINER (logic/wiring only) → uses the presentational <ScheduleTableView/>
"use client";
import * as React from "react";
import type { Pagination, Schedule } from "@/lib/admin/schedule/types";
import {
  canStart,
  canComplete,
  canCancel,
  canReopen,
} from "@/lib/admin/schedule/utils";
import { ScheduleRepo } from "@/lib/admin/schedule/store";
import { ScheduleTableView, type RowView } from "./ScheduleTableView.ui";

type Props = {
  rows: Schedule[];
  pagination: Pagination;
  selected: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onEdit: (row: Schedule) => void;
  onDeleteMany: (ids: string[]) => void;
  onSetStatus: (id: string, s: Schedule["status"]) => void;
  onPageChange: (p: number) => void;
  onView: (row: Schedule) => void;
  toolbar: React.ReactNode;
};

export default function ScheduleTableContainer(props: Props) {
  const {
    rows,
    pagination,
    selected,
    onToggleAll,
    onToggleOne,
    onEdit,
    onDeleteMany,
    onSetStatus,
    onPageChange,
    onView,
    toolbar,
  } = props;

  // map ids → human labels (no UI decisions here)
  const driverMap = React.useMemo(
    () => new Map(ScheduleRepo.constants.drivers.map((d) => [d.id, d.name])),
    []
  );
  const vehicleMap = React.useMemo(
    () => new Map(ScheduleRepo.constants.vehicles.map((v) => [v.id, v.label])),
    []
  );

  const uiRows: RowView[] = React.useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        tripId: r.tripId,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        origin: r.origin,
        destination: r.destination,
        driverName: driverMap.get(r.driverId) ?? "—",
        vehicleName: vehicleMap.get(r.vehicleId) ?? "—",
        can: {
          start: canStart(r),
          complete: canComplete(r),
          cancel: canCancel(r),
          reopen: canReopen(r),
        },
        onView: () => onView(r),
        onEdit: () => onEdit(r),
        onStart: () => onSetStatus(r.id, "ONGOING"),
        onComplete: () => onSetStatus(r.id, "COMPLETED"),
        onCancel: () => onSetStatus(r.id, "CANCELLED"),
        onReopen: () => onSetStatus(r.id, "PLANNED"),
      })),
    [rows, driverMap, vehicleMap, onEdit, onSetStatus, onView]
  );

  return (
    <ScheduleTableView
      rows={uiRows}
      pagination={pagination}
      selected={selected}
      onToggleOne={onToggleOne}
      onToggleAll={onToggleAll}
      onDeleteMany={() => onDeleteMany(Array.from(selected))}
      onPageChange={onPageChange}
      toolbar={toolbar}
    />
  );
}
