"use client";

import { useMemo, useRef } from "react";
import { PageHeader, PageBody } from "@/components/common/Page";

/* ---------- types you can reuse ---------- */
export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  campus: string;
  phone?: string;
  avatar?: string; // data URL (preview) or CDN URL
  notifyEmail: boolean;
  notifyPush: boolean;
};

export type PasswordState = { new: string; confirm: string };

export type ProfileErrors = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  campus: string;
  passwordNew: string;
  passwordConfirm: string;
}>;

type Props = {
  profile: ProfileData;
  password: PasswordState;
  saving: boolean;
  savedAt: string | null;
  errors: ProfileErrors;

  onChangeProfile: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onChangePassword: (patch: Partial<PasswordState>) => void;
  onAvatarChange: (file?: File) => void;
  onSubmit: () => void;
  onReset?: () => void;
};

/* ---------- styles ---------- */
const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300";
const label = "text-sm font-medium text-neutral-700";
const section = "rounded-lg border bg-white p-4";
const help = "text-xs text-neutral-500";

export default function ProfileView({
  profile,
  password,
  saving,
  savedAt,
  errors,
  onChangeProfile,
  onChangePassword,
  onAvatarChange,
  onSubmit,
  onReset,
}: Props) {
  const formId = "facultyProfileForm";
  const fileRef = useRef<HTMLInputElement | null>(null);

  const initials = useMemo(() => {
    const f = profile.firstName?.[0] ?? "";
    const l = profile.lastName?.[0] ?? "";
    return (f + l).toUpperCase() || "F";
  }, [profile.firstName, profile.lastName]);

  const pickAvatar = () => fileRef.current?.click();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your faculty account details and preferences."
        actions={
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="rounded-md bg-[#7a0019] px-3 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          {/* LEFT: FORM */}
          <form
            id={formId}
            className="min-w-0 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {/* Personal */}
            <section className={section}>
              <h2 className="mb-3 font-medium">Personal Information</h2>

              <div className="mb-4 flex items-center gap-4">
                <div>
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full border bg-neutral-200 text-lg font-semibold text-neutral-700">
                      {initials}
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={pickAvatar}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    Change photo
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onAvatarChange(e.target.files?.[0])}
                  />
                  <div className={help}>JPG/PNG, up to ~2MB.</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className={label}>First name *</label>
                  <input
                    className={input}
                    value={profile.firstName}
                    onChange={(e) => onChangeProfile("firstName", e.target.value)}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className={label}>Last name *</label>
                  <input
                    className={input}
                    value={profile.lastName}
                    onChange={(e) => onChangeProfile("lastName", e.target.value)}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={label}>Email *</label>
                  <input
                    className={input}
                    value={profile.email}
                    onChange={(e) => onChangeProfile("email", e.target.value)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Organization */}
            <section className={section}>
              <h2 className="mb-3 font-medium">Organization</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className={label}>Department *</label>
                  <input
                    className={input}
                    value={profile.department}
                    onChange={(e) => onChangeProfile("department", e.target.value)}
                    placeholder="e.g., CCMS"
                  />
                  {errors.department && (
                    <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                  )}
                </div>
                <div>
                  <label className={label}>Campus *</label>
                  <input
                    className={input}
                    value={profile.campus}
                    onChange={(e) => onChangeProfile("campus", e.target.value)}
                    placeholder="e.g., Lucena"
                  />
                  {errors.campus && (
                    <p className="mt-1 text-xs text-red-600">{errors.campus}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={label}>Phone (optional)</label>
                  <input
                    className={input}
                    value={profile.phone ?? ""}
                    onChange={(e) => onChangeProfile("phone", e.target.value)}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className={section}>
              <h2 className="mb-3 font-medium">Preferences</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={profile.notifyEmail}
                    onChange={(e) => onChangeProfile("notifyEmail", e.target.checked)}
                  />
                  Email notifications
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={profile.notifyPush}
                    onChange={(e) => onChangeProfile("notifyPush", e.target.checked)}
                  />
                  Push notifications
                </label>
              </div>
              <p className={`${help} mt-2`}>
                You’ll receive updates about request approvals, schedule changes, and reminders.
              </p>
            </section>

            {/* Security */}
            <section className={section}>
              <h2 className="mb-3 font-medium">Security</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className={label}>New password</label>
                  <input
                    type="password"
                    className={input}
                    value={password.new}
                    onChange={(e) => onChangePassword({ new: e.target.value })}
                    placeholder="Min 8 characters"
                  />
                  {errors.passwordNew && (
                    <p className="mt-1 text-xs text-red-600">{errors.passwordNew}</p>
                  )}
                </div>
                <div>
                  <label className={label}>Confirm new password</label>
                  <input
                    type="password"
                    className={input}
                    value={password.confirm}
                    onChange={(e) => onChangePassword({ confirm: e.target.value })}
                  />
                  {errors.passwordConfirm && (
                    <p className="mt-1 text-xs text-red-600">{errors.passwordConfirm}</p>
                  )}
                </div>
              </div>
              <p className={`${help} mt-2`}>Leave blank to keep your current password.</p>
            </section>

            {onReset && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
                  onClick={onReset}
                >
                  Reset
                </button>
              </div>
            )}
          </form>

          {/* RIGHT: SUMMARY / HELP */}
          <aside className="space-y-4">
            <section className="rounded-lg bg-[#5c0013] p-4 text-white">
              <div className="flex items-center gap-3">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 font-semibold">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="text-lg font-semibold">
                    {profile.firstName} {profile.lastName}
                  </div>
                  <div className="text-xs opacity-80">Faculty • {profile.campus}</div>
                </div>
              </div>
              {savedAt && <div className="mt-3 text-xs opacity-90">Last saved: {savedAt}</div>}
            </section>

            <section className={section}>
              <h3 className="mb-2 font-medium">Account tips</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                <li>Use a school email for faster approval.</li>
                <li>Keep your contact number updated for urgent notices.</li>
                <li>Enable notifications so you don’t miss schedule changes.</li>
              </ul>
            </section>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
