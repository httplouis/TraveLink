// src/components/admin/drivers/forms/DriverFormModal.view.tsx
"use client";

import * as React from "react";
import { FileUpload } from "@/components/common/file_upload/FileUpload.ui";

export type DriverFormValues = {
  code: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  status: string;
  hireDate?: string;
  licenseNo: string;
  licenseClass: string;
  licenseExpiryISO: string; // yyyy-mm-dd
  assignedVehicleId?: string;
  lastCheckIn?: string;
  rating?: number;
  notes?: string;
  avatarUrl?: string;
  docLicenseUrl?: string;
  docGovtIdUrl?: string;
};

const BRAND = "#7a0019";

/** =============== BORDERLESS, SOFT UI VIEW =============== */
export function DriverFormModalView({
  open,
  mode = "create",
  values,
  statuses,
  licenseClasses,
  error,
  onClose,
  onSubmit,
  onChange,
  onAvatarChange,
  onLicenseDocChange,
  onGovtIdDocChange,
}: {
  open: boolean;
  mode?: "create" | "edit";
  values: DriverFormValues;
  statuses: ReadonlyArray<string>;
  licenseClasses: ReadonlyArray<string>;
  error?: string | null;

  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: <K extends keyof DriverFormValues>(k: K, v: DriverFormValues[K]) => void;

  onAvatarChange: (_file: File | null, url?: string) => void;
  onLicenseDocChange: (_file: File | null, url?: string) => void;
  onGovtIdDocChange: (_file: File | null, url?: string) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="mx-auto flex h-full w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-3xl bg-white/90 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5">
          <div className="text-lg font-semibold">
            {mode === "edit" ? "Edit Driver" : "Add Driver"}
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
          >
            Close
          </button>
        </div>

        {/* Body (soft sections, no hard borders) */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 pb-28">
          {error && (
            <div className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          <SoftSection title="Profile">
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <div>
                {/* FileUpload keeps its own look; still sits nicely in the soft card */}
                <FileUpload
                  label="Avatar"
                  preview={values.avatarUrl || undefined}
                  onChange={onAvatarChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputSoft
                  label="First name"
                  value={values.firstName}
                  onChange={(v) => onChange("firstName", v)}
                />
                <InputSoft
                  label="Last name"
                  value={values.lastName}
                  onChange={(v) => onChange("lastName", v)}
                />
                <InputSoft
                  label="Driver code"
                  value={values.code}
                  onChange={(v) => onChange("code", v)}
                />
                <SelectSoft
                  label="Status"
                  value={values.status}
                  onChange={(v) => onChange("status", v)}
                  options={statuses}
                />
              </div>
            </div>
          </SoftSection>

          <SoftSection title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputSoft
                label="Phone"
                value={values.phone ?? ""}
                onChange={(v) => onChange("phone", v)}
                inputMode="tel"
              />
              <InputSoft
                label="Email"
                value={values.email ?? ""}
                onChange={(v) => onChange("email", v)}
                inputMode="email"
              />
            </div>
          </SoftSection>

          <SoftSection title="License">
            <div className="grid gap-4 sm:grid-cols-3">
              <InputSoft
                label="License No."
                value={values.licenseNo}
                onChange={(v) => onChange("licenseNo", v)}
              />
              <SelectSoft
                label="Class"
                value={values.licenseClass}
                onChange={(v) => onChange("licenseClass", v)}
                options={licenseClasses}
              />
              <DateSoft
                label="Expiry"
                value={values.licenseExpiryISO}
                onChange={(v) => onChange("licenseExpiryISO", v)}
              />
            </div>
          </SoftSection>

          <SoftSection title="Employment">
            <div className="grid gap-4 sm:grid-cols-3">
              <DateSoft
                label="Hire date"
                value={values.hireDate ?? ""}
                onChange={(v) => onChange("hireDate", v)}
              />
              <InputSoft
                label="Assigned vehicle (ID)"
                value={values.assignedVehicleId ?? ""}
                onChange={(v) => onChange("assignedVehicleId", v)}
              />
              <InputSoft
                label="Rating (0-5)"
                value={values.rating != null ? String(values.rating) : ""}
                onChange={(v) =>
                  onChange("rating", v === "" ? undefined : Number(v))
                }
                inputMode="decimal"
              />
            </div>

            <div className="mt-4">
              <TextAreaSoft
                label="Notes"
                value={values.notes ?? ""}
                onChange={(v) => onChange("notes", v)}
                placeholder="Anything important about this driver…"
              />
            </div>
          </SoftSection>

          <SoftSection title="Documents">
            <div className="grid gap-4 sm:grid-cols-2">
              <FileUpload
                label="License document"
                preview={values.docLicenseUrl || undefined}
                onChange={onLicenseDocChange}
                accept="application/pdf,image/*"
              />
              <FileUpload
                label="Government ID"
                preview={values.docGovtIdUrl || undefined}
                onChange={onGovtIdDocChange}
                accept="application/pdf,image/*"
              />
            </div>
          </SoftSection>
        </form>

        {/* Floating footer (always visible) */}
        <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 w-full max-w-4xl -translate-x-1/2 px-6 pb-4">
          <div className="flex items-center justify-end gap-2 rounded-full bg-white/90 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-100 px-4 py-2 text-sm hover:bg-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="__driver_form_id__"
              className="rounded-full px-5 py-2 text-sm font-medium text-white"
              style={{ background: BRAND }}
              onClick={() => {
                const formEl = document.querySelector("form");
                if (formEl) (formEl as HTMLFormElement).requestSubmit();
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Soft UI pieces (no hard borders) ===================== */

function SoftSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-3xl bg-neutral-50 px-5 py-5 shadow-inner">
      <h3 className="mb-3 text-sm font-semibold text-neutral-800">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-xs font-medium text-neutral-600">{children}</div>;
}

function InputShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center rounded-2xl bg-neutral-100 px-3 shadow-inner ring-0 focus-within:ring-2 focus-within:ring-[#7a0019]/25">
      {children}
    </div>
  );
}

function InputSoft({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <InputShell>
        <input
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="w-full bg-transparent outline-none text-sm"
        />
      </InputShell>
    </div>
  );
}

function TextAreaSoft({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="min-h-[88px] rounded-2xl bg-neutral-100 px-3 py-2 shadow-inner ring-0 focus-within:ring-2 focus-within:ring-[#7a0019]/25">
        <textarea
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={placeholder}
          className="w-full resize-y bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function DateSoft({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <InputShell>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </InputShell>
    </div>
  );
}

function SelectSoft({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<string>;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <InputShell>
        <select
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="w-full bg-transparent text-sm outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </InputShell>
    </div>
  );
}
