// src/components/admin/schedule/forms/CreateScheduleDialog.ui.tsx
"use client";
import * as React from "react";
import MapPicker, { PickedPlace } from "@/components/common/map/MapPicker.ui";
import CreateScheduleDialogView, {
  CreateForm, DriverOption, VehicleOption
} from "./CreateScheduleDialog.view";

export type { CreateForm, DriverOption, VehicleOption };

type Props = {
  open: boolean;
  tripIdPreview?: string;
  form?: CreateForm;
  drivers?: DriverOption[];
  vehicles?: VehicleOption[];
  driverConflicts?: Array<{ id: string; title: string; date: string; startTime: string; endTime: string }>;
  vehicleConflicts?: Array<{ id: string; title: string; date: string; startTime: string; endTime: string }>;
  disableSave?: boolean;

  onChange?: (patch: Partial<CreateForm & {
    originPlace?: PickedPlace | null; destinationPlace?: PickedPlace | null;
  }>) => void;
  onClose: () => void;
  onSave?: () => void;
};

export default function CreateScheduleDialogUI({
  open,
  tripIdPreview = "",
  form: formIn,
  drivers = [],
  vehicles = [],
  driverConflicts = [],
  vehicleConflicts = [],
  disableSave = false,
  onChange = () => {},
  onClose,
  onSave = () => {},
}: Props) {
  // keep place objects in the container (hindi kasama sa View)
  const [originPlace, setOriginPlace] = React.useState<PickedPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = React.useState<PickedPlace | null>(null);
  const [openOriginMap, setOpenOriginMap] = React.useState(false);
  const [openDestMap, setOpenDestMap] = React.useState(false);

  const form: CreateForm = {
    requestId: formIn?.requestId ?? null,
    title: formIn?.title ?? "",
    origin: formIn?.origin ?? "",
    destination: formIn?.destination ?? "",
    date: formIn?.date ?? new Date().toISOString().slice(0, 10),
    startTime: formIn?.startTime ?? "08:00",
    endTime: formIn?.endTime ?? "09:00",
    driverId: formIn?.driverId ?? "",
    vehicleId: formIn?.vehicleId ?? "",
    status: formIn?.status ?? "PLANNED",
    notes: formIn?.notes ?? "",
  };

  return (
    <>
      <CreateScheduleDialogView
        open={open}
        tripIdPreview={tripIdPreview}
        form={form}
        drivers={drivers}
        vehicles={vehicles}
        driverConflicts={driverConflicts}
        vehicleConflicts={vehicleConflicts}
        disableSave={disableSave}
        onChange={(patch) => onChange(patch)}
        onPickOrigin={() => setOpenOriginMap(true)}
        onPickDestination={() => setOpenDestMap(true)}
        onClose={onClose}
        onSave={onSave}
      />

      {/* Map pickers live in the container */}
      <MapPicker
        open={openOriginMap}
        initial={originPlace}
        onClose={() => setOpenOriginMap(false)}
        onPick={(p) => {
          setOriginPlace(p);
          onChange({ origin: p.address, originPlace: p });
          setOpenOriginMap(false);
        }}
      />
      <MapPicker
        open={openDestMap}
        initial={destinationPlace}
        onClose={() => setOpenDestMap(false)}
        onPick={(p) => {
          setDestinationPlace(p);
          onChange({ destination: p.address, destinationPlace: p });
          setOpenDestMap(false);
        }}
      />
    </>
  );
}
