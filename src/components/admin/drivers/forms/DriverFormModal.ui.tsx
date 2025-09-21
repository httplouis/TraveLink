// File: src/components/admin/drivers/forms/DriverFormModal.ui.tsx
"use client";
import * as React from "react";
import type { Driver } from "@/lib/admin/drivers/types";
import { DriversRepo } from "@/lib/admin/drivers/store";
import { validate } from "@/lib/admin/drivers/utils";

import { TextInput } from "@/components/common/inputs/TextInput.ui";
import { DateInput } from "@/components/common/inputs/DateInput.ui";
import { Select } from "@/components/common/inputs/Select.ui";
import { FileUpload } from "@/components/common/file_upload/FileUpload.ui";

const BRAND = "#7a0019";
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
  const [form, setForm] = React.useState<FormShape>(() => ({
    code: initial?.code ?? "",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    status: (initial?.status as any) ?? DriversRepo.constants.statuses[0],
    hireDate: initial?.hireDate ?? "",
    licenseNo: initial?.licenseNo ?? "",
    licenseClass:
      (initial?.licenseClass as any) ?? DriversRepo.constants.licenseClasses[0],
    licenseExpiryISO:
      initial?.licenseExpiryISO ?? new Date().toISOString().slice(0, 10),
    assignedVehicleId: initial?.assignedVehicleId ?? "",
    lastCheckIn: initial?.lastCheckIn ?? "",
    rating: initial?.rating ?? undefined,
    notes: initial?.notes ?? "",
    avatarUrl: initial?.avatarUrl ?? "",
    docLicenseUrl: initial?.docLicenseUrl ?? "",
    docGovtIdUrl: initial?.docGovtIdUrl ?? "",
  }));
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setForm({
      code: initial?.code ?? "",
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      status: (initial?.status as any) ?? DriversRepo.constants.statuses[0],
      hireDate: initial?.hireDate ?? "",
      licenseNo: initial?.licenseNo ?? "",
      licenseClass:
        (initial?.licenseClass as any) ?? DriversRepo.constants.licenseClasses[0],
      licenseExpiryISO:
        initial?.licenseExpiryISO ?? new Date().toISOString().slice(0, 10),
      assignedVehicleId: initial?.assignedVehicleId ?? "",
      lastCheckIn: initial?.lastCheckIn ?? "",
      rating: initial?.rating ?? undefined,
      notes: initial?.notes ?? "",
      avatarUrl: initial?.avatarUrl ?? "",
      docLicenseUrl: initial?.docLicenseUrl ?? "",
      docGovtIdUrl: initial?.docGovtIdUrl ?? "",
    });
    setErr(null);
  }, [open, initial]);

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form as any);
    if (v) return setErr(v);
    onSubmit(form);
  };

  const handleAvatar = (_: File | null, url?: string) =>
    setForm((f) => ({ ...f, avatarUrl: url ?? "" }));
  const handleLicenseDoc = (_: File | null, url?: string) =>
    setForm((f) => ({ ...f, docLicenseUrl: url ?? "" }));
  const handleGovtIdDoc = (_: File | null, url?: string) =>
    setForm((f) => ({ ...f, docGovtIdUrl: url ?? "" }));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      {/* wrapper is a column with sticky header and scrollable body */}
      <div
        className="mx-auto flex h-full w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit Driver" : "Add Driver"}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white shadow hover:bg-red-700 focus:outline-none"
          >
            Close
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={submit} className="grid gap-4">
            {err && (
              <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}

            <FileUpload
              label="Avatar"
              preview={form.avatarUrl || undefined}
              onChange={handleAvatar}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="First name"
                value={form.firstName}
                onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
              />
              <TextInput
                label="Last name"
                value={form.lastName}
                onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Driver code"
                value={form.code}
                onChange={(v) => setForm((f) => ({ ...f, code: v }))}
              />
              <Select
                label="Status"
                value={form.status as any}
                options={DriversRepo.constants.statuses as any}
                onChange={(v) => setForm((f) => ({ ...f, status: v as any }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Phone"
                value={form.phone ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <TextInput
                label="Email"
                value={form.email ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput
                label="License No."
                value={form.licenseNo}
                onChange={(v) => setForm((f) => ({ ...f, licenseNo: v }))}
              />
              <Select
                label="Class"
                value={form.licenseClass as any}
                options={DriversRepo.constants.licenseClasses as any}
                onChange={(v) =>
                  setForm((f) => ({ ...f, licenseClass: v as any }))
                }
              />
              <DateInput
                label="Expiry"
                value={form.licenseExpiryISO}
                onChange={(v) =>
                  setForm((f) => ({ ...f, licenseExpiryISO: v }))
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DateInput
                label="Hire date"
                value={form.hireDate ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, hireDate: v }))}
              />
              <TextInput
                label="Assigned vehicle (ID)"
                value={form.assignedVehicleId ?? ""}
                onChange={(v) =>
                  setForm((f) => ({ ...f, assignedVehicleId: v }))
                }
              />
              <TextInput
                label="Rating (0-5)"
                value={form.rating != null ? String(form.rating) : ""}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    rating: v === "" ? undefined : Number(v),
                  }))
                }
              />
            </div>

            <TextInput
              label="Notes"
              value={form.notes ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <FileUpload
                label="License document"
                preview={form.docLicenseUrl || undefined}
                onChange={handleLicenseDoc}
                accept="application/pdf,image/*"
              />
              <FileUpload
                label="Government ID"
                preview={form.docGovtIdUrl || undefined}
                onChange={handleGovtIdDoc}
                accept="application/pdf,image/*"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border bg-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-white"
                style={{ background: BRAND }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
