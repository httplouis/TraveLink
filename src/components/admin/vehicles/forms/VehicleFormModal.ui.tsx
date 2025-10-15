// File: src/components/admin/vehicles/forms/VehicleFormModal.ui.tsx
"use client";
import * as React from "react";
import type { Vehicle } from "@/lib/admin/vehicles/types";
import { VehiclesRepo } from "@/lib/admin/vehicles/store";
import { validate } from "@/lib/admin/vehicles/utils";

import { Modal } from "@/components/common/Modal.ui";
import { FormSection } from "@/components/common/forms/FormSection.ui";
import { FormActions } from "@/components/common/forms/FormActions.ui";
import { TextInput } from "@/components/common/inputs/TextInput.ui";
import { NumberInput } from "@/components/common/inputs/NumberInput.ui";
import { DateInput } from "@/components/common/inputs/DateInput.ui";
import { Select } from "@/components/common/inputs/Select.ui";
import { FileUpload } from "@/components/common/file_upload/FileUpload.ui";

type FormShape = Omit<Vehicle, "id" | "createdAt" | "updatedAt"> & {
  photoUrl?: string;
};

export function VehicleFormModal({
  open,
  initial,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  initial?: Partial<Vehicle>;
  onCancel: () => void;
  onSubmit: (data: FormShape) => void;
}) {
  const [form, setForm] = React.useState<FormShape>(() => ({
    plateNo: initial?.plateNo ?? "",
    code: initial?.code ?? "",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    type: (initial?.type as any) ?? VehiclesRepo.constants.types[0],
    capacity: initial?.capacity ?? 1,
    status: (initial?.status as any) ?? VehiclesRepo.constants.statuses[0],
    odometerKm: initial?.odometerKm ?? 0,
    lastServiceISO:
      initial?.lastServiceISO ?? new Date().toISOString().slice(0, 10),
    notes: initial?.notes ?? "",
    photoUrl: (initial as any)?.photoUrl ?? "",
  }));
  const [err, setErr] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | undefined>(
    (initial as any)?.photoUrl
  );

  React.useEffect(() => {
    if (!open) return;
    setForm({
      plateNo: initial?.plateNo ?? "",
      code: initial?.code ?? "",
      brand: initial?.brand ?? "",
      model: initial?.model ?? "",
      type: (initial?.type as any) ?? VehiclesRepo.constants.types[0],
      capacity: initial?.capacity ?? 1,
      status: (initial?.status as any) ?? VehiclesRepo.constants.statuses[0],
      odometerKm: initial?.odometerKm ?? 0,
      lastServiceISO:
        initial?.lastServiceISO ?? new Date().toISOString().slice(0, 10),
      notes: initial?.notes ?? "",
      photoUrl: (initial as any)?.photoUrl ?? "",
    });
    setPreview((initial as any)?.photoUrl || undefined);
    setErr(null);
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate(form as any);
    if (msg) {
      setErr(msg);
      return;
    }
    onSubmit(form);
  };

  // FileUpload callback
  const handleFile = (file: File | null, url?: string) => {
    if (!file) {
      setPreview(undefined);
      setForm((f) => ({ ...f, photoUrl: "" }));
      return;
    }
    setPreview(url);
    setForm((f) => ({ ...f, photoUrl: url || "" }));
  };

  return (
    <Modal
      open={open}
      title={initial ? "Edit Vehicle" : "Add Vehicle"}
      onClose={onCancel}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={submit} className="grid gap-4">
        {err && (
          <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        {/* Photo */}
        <FormSection title="Photo">
          <FileUpload label="Upload a photo" onChange={handleFile} />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="h-40 w-full rounded-lg object-cover"
            />
          )}
        </FormSection>

        {/* Basics */}
        <FormSection title="Vehicle information">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Plate No."
              value={form.plateNo}
              onChange={(v) => setForm((f) => ({ ...f, plateNo: v }))}
            />
            <TextInput
              label="Vehicle Code"
              value={form.code}
              onChange={(v) => setForm((f) => ({ ...f, code: v }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Brand"
              value={form.brand}
              onChange={(v) => setForm((f) => ({ ...f, brand: v }))}
            />
            <TextInput
              label="Model"
              value={form.model}
              onChange={(v) => setForm((f) => ({ ...f, model: v }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              label="Type"
              value={form.type as any}
              options={VehiclesRepo.constants.types as any}
              onChange={(v) => setForm((f) => ({ ...f, type: v as any }))}
            />
            <NumberInput
              label="Capacity"
              value={form.capacity}
              min={1}
              onChange={(v) => setForm((f) => ({ ...f, capacity: v }))}
            />
            <Select
              label="Status"
              value={form.status as any}
              options={VehiclesRepo.constants.statuses as any}
              onChange={(v) => setForm((f) => ({ ...f, status: v as any }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <NumberInput
              label="Odometer (km)"
              value={form.odometerKm}
              min={0}
              onChange={(v) => setForm((f) => ({ ...f, odometerKm: v }))}
            />
            <DateInput
              label="Last Service"
              value={form.lastServiceISO}
              onChange={(v) => setForm((f) => ({ ...f, lastServiceISO: v }))}
            />
            <TextInput
              label="Notes (optional)"
              value={form.notes ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            />
          </div>
        </FormSection>

        <FormActions onCancel={onCancel} submitLabel="Save" brand="#7a0019" />
      </form>
    </Modal>
  );
}
