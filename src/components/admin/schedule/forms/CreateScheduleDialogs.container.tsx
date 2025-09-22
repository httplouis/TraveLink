// src/components/admin/schedule/forms/CreateScheduleDialogs.container.tsx
"use client";
import * as React from "react";
import CreateScheduleDialogUI, {
  CreateForm,
  DriverOption,
  VehicleOption,
} from "./CreateScheduleDialog.ui";
import { ScheduleRepo } from "@/lib/admin/schedule/store";
import type { Schedule } from "@/lib/admin/schedule/types";
import {
  isDriverAvailable,
  isVehicleAvailable,
  conflictsForDriver,
  conflictsForVehicle,
} from "@/lib/admin/schedule/utils";

type Props = {
  open: boolean;
  initial?: Partial<Schedule>;
  onClose: () => void;
  onSubmit: (data: Omit<Schedule, "id" | "createdAt" | "tripId">) => void;
};

const makeInit = (initial?: Partial<Schedule>): CreateForm => {
  const { drivers, vehicles } = ScheduleRepo.constants;
  return {
    requestId: initial?.requestId ?? null,
    title: initial?.title ?? "",
    origin: initial?.origin ?? "",
    destination: initial?.destination ?? "",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    startTime: initial?.startTime ?? "08:00",
    endTime: initial?.endTime ?? "09:00",
    driverId: initial?.driverId ?? (drivers[0]?.id ?? ""),
    vehicleId: initial?.vehicleId ?? (vehicles[0]?.id ?? ""),
    status: (initial?.status as CreateForm["status"]) ?? "PLANNED",
    notes: initial?.notes ?? "",
    originPlace: null,
    destinationPlace: null,
  };
};

export default function CreateScheduleDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = React.useState<CreateForm>(makeInit(initial));

  React.useEffect(() => {
    if (open) setForm(makeInit(initial));
  }, [open, initial]);

  const snapshot = ScheduleRepo.list();
  const editingId = (initial?.id as string) || undefined;

  // Probe event with current form (used by availability/conflict utils)
  const probe: Schedule = {
    id: editingId || "new",
    createdAt: new Date().toISOString(),
    tripId: "PREVIEW",
    title: form.title,
    origin: form.origin,
    destination: form.destination,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    driverId: form.driverId,
    vehicleId: form.vehicleId,
    status: form.status,
    notes: form.notes,
  };

  // Build options w/ busy flag
  const drivers: DriverOption[] = ScheduleRepo.constants.drivers.map((d) => ({
    id: d.id,
    name: d.name,
    busy: !isDriverAvailable(snapshot, d.id, probe, editingId),
  }));

  const vehicles: VehicleOption[] = ScheduleRepo.constants.vehicles.map((v) => ({
    id: v.id,
    label: v.label,
    plateNo: v.plateNo,
    busy: !isVehicleAvailable(snapshot, v.id, probe, editingId),
  }));

  // Conflicts for the selected driver/vehicle (to show details + disable save)
  const driverConflicts = conflictsForDriver(snapshot, form.driverId, probe, editingId);
  const vehicleConflicts = conflictsForVehicle(snapshot, form.vehicleId, probe, editingId);
  const disableSave = driverConflicts.length > 0 || vehicleConflicts.length > 0;

  const tripIdPreview = ScheduleRepo.peekTripId(form.date);

  return (
    <CreateScheduleDialogUI
      open={open}
      tripIdPreview={tripIdPreview}
      form={form}
      drivers={drivers}
      vehicles={vehicles}
      driverConflicts={driverConflicts}
      vehicleConflicts={vehicleConflicts}
      disableSave={disableSave}
      onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
      onClose={onClose}
      onSave={() => {
        if (disableSave) return;
        const { originPlace, destinationPlace, ...payload } = form;
        onSubmit(payload);
      }}
    />
  );
}
