// src/components/admin/drivers/forms/DriverFormModal.ui.tsx
"use client";
import * as React from "react";
import type { Driver } from "@/lib/admin/drivers/types";
import { DriversRepo } from "@/lib/admin/drivers/store";
import { validate } from "@/lib/admin/drivers/utils";

import {
  DriverFormModalView,
  type DriverFormValues,
} from "./DriverFormModal.view";

type FormShape = Omit<Driver, "id" | "createdAt" | "updatedAt">;

export function DriverFormModal({
  open,
  initial,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  initial?: Partial<Driver>;
  onCancel: () => void;
  onSubmit: (data: FormShape) => void;
}) {
  const makeInit = React.useCallback(
    (seed?: Partial<Driver>): DriverFormValues => ({
      code: seed?.code ?? "",
      firstName: seed?.firstName ?? "",
      lastName: seed?.lastName ?? "",
      phone: seed?.phone ?? "",
      email: seed?.email ?? "",
      status: (seed?.status as any) ?? DriversRepo.constants.statuses[0],
      hireDate: seed?.hireDate ?? "",
      licenseNo: seed?.licenseNo ?? "",
      licenseClass:
        (seed?.licenseClass as any) ?? DriversRepo.constants.licenseClasses[0],
      licenseExpiryISO:
        seed?.licenseExpiryISO ?? new Date().toISOString().slice(0, 10),
      assignedVehicleId: seed?.assignedVehicleId ?? "",
      lastCheckIn: seed?.lastCheckIn ?? "",
      rating: seed?.rating ?? undefined,
      notes: seed?.notes ?? "",
      avatarUrl: seed?.avatarUrl ?? "",
      docLicenseUrl: seed?.docLicenseUrl ?? "",
      docGovtIdUrl: seed?.docGovtIdUrl ?? "",
    }),
    []
  );

  const [form, setForm] = React.useState<DriverFormValues>(makeInit(initial));
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setForm(makeInit(initial));
    setErr(null);
  }, [open, initial, makeInit]);

  // close on ESC + lock background scroll while open
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form as any);
    if (v) return setErr(v);
    onSubmit(form as FormShape);
  };

  const statuses = DriversRepo.constants.statuses;
  const licenseClasses = DriversRepo.constants.licenseClasses;

  return (
    <DriverFormModalView
      open={open}
      mode={initial ? "edit" : "create"}
      values={form}
      statuses={statuses}
      licenseClasses={licenseClasses}
      error={err}
      onClose={onCancel}
      onSubmit={handleSubmit}
      onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
      onAvatarChange={(_file, url) =>
        setForm((f) => ({ ...f, avatarUrl: url ?? "" }))
      }
      onLicenseDocChange={(_file, url) =>
        setForm((f) => ({ ...f, docLicenseUrl: url ?? "" }))
      }
      onGovtIdDocChange={(_file, url) =>
        setForm((f) => ({ ...f, docGovtIdUrl: url ?? "" }))
      }
    />
  );
}
