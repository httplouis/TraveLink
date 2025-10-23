"use client";

import * as React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Calendar, Mail, LogOut, X, Upload, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/common/confirm/ConfirmDialog";
import type { UserProfile } from "@/lib/user/types";
import Field from "./parts/Field";
import Label from "./parts/Label";
import InfoCard from "./parts/InfoCard";
import AvatarPreview from "./parts/AvatarPreview";
import DepartmentSelect from "./parts/DepartmentSelect";

/* ---------------- Types ---------------- */
type Errors = Partial<Record<keyof UserProfile | "phone", string>>;

type UIState = {
  draft: UserProfile | null;
  orig: UserProfile | null;
  errors: Errors;
  isDirty: boolean;
  isInvalid: boolean;
  showLogout: boolean;
  confirmSave: boolean;
  confirmDiscard: boolean;
};

type FmtFns = {
  fullName: (p: UserProfile | null) => string;
  fmtJoined: (p?: string) => string;
};

type Handlers = {
  onCloseRequest: () => void;
  onAvatarPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setField: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void;
  resetToOrig: () => void;
  requestSave: () => void;
  reallySave: () => void;
  reallyDiscard: () => void;
  setShowLogout: (v: boolean) => void;
  doLogout: () => Promise<void>;
  setConfirmSave: (v: boolean) => void;
  setConfirmDiscard: (v: boolean) => void;
};

type Props = {
  open: boolean;
  brand: string;
  departments: readonly string[];
  state: UIState;
  fmt: FmtFns;
  handlers: Handlers;
};
/* -------------------------------------- */

export default function ProfileSheetView({ open, brand, departments, state, fmt, handlers }: Props) {
  const { draft, errors, isDirty, isInvalid } = state;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleRemoveAvatar() {
    handlers.setField("avatarUrl", null as any);
  }

  return (
    <>
      <Transition show={open} as={React.Fragment}>
        <Dialog onClose={handlers.onCloseRequest} className="relative z-[95]">
          {/* Overlay */}
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          {/* Right sheet */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 flex justify-end">
              <Transition.Child
                as={React.Fragment}
                enter="transform transition duration-300 ease-out"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition duration-200 ease-in"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="h-full w-full max-w-[560px] bg-white shadow-2xl">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 text-white"
                    style={{ backgroundColor: "var(--admin-brand, #7a0019)" }}
                  >
                    <Dialog.Title className="text-base font-semibold">User Profile</Dialog.Title>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                        onClick={() => handlers.setShowLogout(true)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <LogOut className="h-4 w-4" /> Logout
                        </span>
                      </button>
                      <button
                        className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/15"
                        onClick={handlers.onCloseRequest}
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="h-full overflow-y-auto p-5 pb-24">
                    {draft ? (
                      <>
                        {/* Top row: Avatar + name (left) and photo actions (right) */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <AvatarPreview srcUrl={draft.avatarUrl} displayName={fmt.fullName(draft)} size={64} />
                            <div className="min-w-0">
                              <div className="text-lg font-semibold text-neutral-900">{fmt.fullName(draft)}</div>
                              <div className="text-sm text-neutral-500">Account</div>
                            </div>
                          </div>

                          {/* Actions aligned to the right on larger screens */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
                            >
                              <Upload className="h-4 w-4" />
                              Upload photo
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlers.onAvatarPick}
                            />
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field
                            label="First name"
                            value={draft.firstName}
                            onChange={(v) => handlers.setField("firstName", v)}
                            error={errors.firstName}
                          />
                          <Field
                            label="Last name"
                            value={draft.lastName}
                            onChange={(v) => handlers.setField("lastName", v)}
                            error={errors.lastName}
                          />

                          <Field label="Email" value={draft.email} readOnly />

                          <Field
                            label="Phone"
                            inputMode="tel"
                            placeholder="09XX XXX XXXX"
                            value={draft.phone ?? ""}
                            onChange={(v) => handlers.setField("phone", v.replace(/[^\d+]/g, ""))}
                            error={errors.phone}
                          />

                          {/* Department (searchable) */}
                          <div className="md:col-span-1">
                            <Label>Department</Label>
                            <DepartmentSelect
                              departments={departments}
                              value={draft.department ?? ""}
                              onChange={(v) => handlers.setField("department", v)}
                              placeholder="Search department…"
                            />
                          </div>

                          <Field
                            label="Employee ID"
                            value={draft.employeeId ?? ""}
                            onChange={(v) => handlers.setField("employeeId", v)}
                          />

                          <InfoCard icon={<Mail className="h-4 w-4" />} title="Account" value={draft.email} />
                          <InfoCard
                            icon={<Calendar className="h-4 w-4" />}
                            title="Joined"
                            value={fmt.fmtJoined(draft.joinedAt)}
                          />
                        </div>

                        {/* Security */}
                        <div className="mt-6">
                          <div className="rounded-xl border border-neutral-200 p-4">
                            <div className="text-sm font-semibold text-neutral-900">Security</div>
                            <button
                              className="mt-3 h-10 rounded-lg border border-neutral-300 px-3 text-sm hover:bg-neutral-50"
                              onClick={() => alert("Change password flow goes here")}
                            >
                              Change password
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Sticky footer */}
                  <div
                    className={[
                      "sticky bottom-0 z-10 border-t border-neutral-200",
                      "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75",
                      "px-4 py-3 flex items-center justify-between",
                    ].join(" ")}
                  >
                    <button
                      onClick={() => handlers.setConfirmDiscard(true)}
                      className="h-10 rounded-lg border border-neutral-300 px-3 text-sm hover:bg-neutral-50"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlers.resetToOrig}
                        className="h-10 rounded-lg border border-neutral-300 px-3 text-sm hover:bg-neutral-50"
                      >
                        Reset to defaults
                      </button>
                      <button
                        onClick={handlers.requestSave}
                        disabled={!isDirty || isInvalid}
                        className="h-10 rounded-lg px-4 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
                        style={{ backgroundColor: "var(--admin-brand, #7a0019)" }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* dialogs */}
      <ConfirmDialog
        open={state.showLogout}
        title="Sign out"
        message="Are you sure you want to logout of your account?"
        confirmLabel="Logout"
        cancelLabel="Stay"
        onCancel={() => handlers.setShowLogout(false)}
        onConfirm={handlers.doLogout}
      />

      <ConfirmDialog
        open={state.confirmSave}
        title="Apply changes"
        message="Save your updated profile details?"
        confirmLabel="Save changes"
        cancelLabel="Review"
        onCancel={() => handlers.setConfirmSave(false)}
        onConfirm={handlers.reallySave}
      />

      <ConfirmDialog
        open={state.confirmDiscard}
        title="Discard changes"
        message="You have unsaved edits. Do you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => handlers.setConfirmDiscard(false)}
        onConfirm={handlers.reallyDiscard}
      />
    </>
  );
}
