"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  Building2,
  MapPin,
  Bell,
  Save,
  Loader2,
  Search,
  BusFront,
  Car,
  Truck,
  Info,
  ShieldCheck,
  KeyRound,
  Clock4,
  Globe,
  ToggleRight,
  BadgeCheck,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import Card from "@/components/common/Card";
import LabeledInput from "@/components/admin/forms/LabeledInput";
import Toggle from "@/components/admin/forms/Toggle";
import CropperModal from "@/components/admin/profile/cropper/CropperModal";
import ConfirmPasswordModal from "@/components/admin/profile/ConfirmPasswordModal";
import AdminProfileToast from "@/components/admin/profile/AdminProfileToast";
import { BRAND_MAROON, getPasswordStrength, wait } from "@/lib/profile";

/* ======================== Types ======================== */
type Vehicle = {
  id: string;
  name: string;
  type: "Bus" | "Van" | "Car";
  status: "Available" | "Maintenance" | "Offline";
};

type Form = {
  adminId: string;
  firstName: string;
  lastName: string;
  email: string;
  dept: string;
  campus: string;
  phone: string;
  campusesManaged: string[];
  autoAssignDrivers: boolean;
  approvalsAutoExpireDays: number;
  emailNotif: boolean;
  pushNotif: boolean;
  maintenanceAlerts: boolean;
  requestDigestDaily: boolean;
  twoFAEnabled: boolean;
  newPassword: string;
  confirmPassword: string;
  avatar?: string;
};

/* helpers for right rail */
const pillTone = (s: Vehicle["status"]) =>
  s === "Available"
    ? "bg-green-100 text-green-700"
    : s === "Maintenance"
    ? "bg-amber-100 text-amber-700"
    : "bg-neutral-100 text-neutral-700";

const iconForType = (t: Vehicle["type"]) => (t === "Bus" ? BusFront : t === "Van" ? Truck : Car);

/* ======================== Page ======================== */
export default function AdminProfilePage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; text: string }>({ show: false, text: "" });
  const [dirty, setDirty] = useState(false);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const defaults: Form = {
    adminId: "F22-33538",
    firstName: "Jolo",
    lastName: "Santos",
    email: "admin@example.edu",
    dept: "CCMS",
    campus: "Lucena",
    phone: "09935583858",
    campusesManaged: ["Lucena"],
    autoAssignDrivers: true,
    approvalsAutoExpireDays: 3,
    emailNotif: true,
    pushNotif: true,
    maintenanceAlerts: true,
    requestDigestDaily: true,
    twoFAEnabled: true,
    newPassword: "",
    confirmPassword: "",
    avatar: undefined,
  };

  const [form, setForm] = useState<Form>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("travilink.admin.profile");
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<Form>;
          return {
            ...defaults,
            ...saved,
            campusesManaged: Array.isArray(saved.campusesManaged) ? saved.campusesManaged : defaults.campusesManaged,
            autoAssignDrivers: saved.autoAssignDrivers ?? defaults.autoAssignDrivers,
            approvalsAutoExpireDays:
              typeof saved.approvalsAutoExpireDays === "number" ? saved.approvalsAutoExpireDays : defaults.approvalsAutoExpireDays,
            emailNotif: saved.emailNotif ?? defaults.emailNotif,
            pushNotif: saved.pushNotif ?? defaults.pushNotif,
            maintenanceAlerts: saved.maintenanceAlerts ?? defaults.maintenanceAlerts,
            requestDigestDaily: saved.requestDigestDaily ?? defaults.requestDigestDaily,
            twoFAEnabled: saved.twoFAEnabled ?? defaults.twoFAEnabled,
            newPassword: "",
            confirmPassword: "",
          };
        } catch {}
      }
    }
    return defaults;
  });

  const fullName = useMemo(() => `${form.firstName || ""} ${form.lastName || ""}`.trim(), [form]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("travilink.admin.profile", JSON.stringify(form));
    }
  }, [form]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
  const phoneOk = !form.phone || /^0?\d{9,11}$/.test(form.phone.replace(/\s|-/g, ""));
  const passStrength = getPasswordStrength(form.newPassword);
  const passOk =
    (!form.newPassword && !form.confirmPassword) ||
    (form.newPassword.length >= 8 && form.newPassword === form.confirmPassword && passStrength.score >= 2);

  const canSave = form.firstName.trim() && form.lastName.trim() && emailOk && phoneOk && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await wait(800);
    setSaving(false);
    setDirty(false);
    setToast({ show: true, text: "Profile saved successfully." });
    setTimeout(() => setToast({ show: false, text: "" }), 1500);
  };

  const handleFileChosen = (f?: File) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setCropSrc(url);
  };

  const removePhoto = () => {
    set("avatar", undefined);
    setToast({ show: true, text: "Photo removed." });
    setTimeout(() => setToast({ show: false, text: "" }), 1400);
  };

  const handleConfirmPassword = async ({ currentPassword, otp }: { currentPassword: string; otp?: string }) => {
    await wait(700);
    const looksValid = currentPassword.length >= 4;
    const otpOk = !form.twoFAEnabled || (otp && otp.length === 6);
    if (!looksValid || !otpOk || !passOk) {
      setToast({ show: true, text: "Password update failed. Check inputs." });
      setTimeout(() => setToast({ show: false, text: "" }), 1600);
      return;
    }
    set("newPassword", "");
    set("confirmPassword", "");
    setConfirmOpen(false);
    setDirty(false);
    setToast({ show: true, text: "Password updated." });
    setTimeout(() => setToast({ show: false, text: "" }), 1500);
  };

  const metrics = [
    { label: "Pending approvals", value: 4 },
    { label: "Online drivers", value: 3 },
    { label: "Active vehicles", value: 5 },
  ];

  const vehicles: Vehicle[] = [
    { id: "v1", name: "Bus 1", type: "Bus", status: "Available" },
    { id: "v2", name: "Bus 2", type: "Bus", status: "Available" },
    { id: "v3", name: "Car 3", type: "Car", status: "Available" },
    { id: "v4", name: "Bus 3", type: "Bus", status: "Available" },
    { id: "v5", name: "Van 1", type: "Van", status: "Maintenance" },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full shrink-0 grid place-items-center text-xs font-bold text-white" style={{ background: BRAND_MAROON }}>
              A
            </div>
            <h1 className="text-base sm:text-lg font-semibold">Admin Profile</h1>
            <p className="text-sm text-neutral-500 hidden md:block truncate">
              Configure admin identity, scope, approval rules, and security.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSave}
              disabled={!canSave}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-white shadow-sm transition
                ${canSave ? "bg-[--brand-700] hover:opacity-95" : "bg-neutral-400 cursor-not-allowed"}`}
              style={{ ["--brand-700" as any]: BRAND_MAROON }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="text-sm font-medium">Save Changes</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 grid grid-cols-12 gap-4 md:gap-5">
        {/* left nav */}
        <AdminLeftNav />

        {/* center form */}
        <section className="col-span-12 md:col-span-6 xl:col-span-6 2xl:col-span-7 grid gap-4 md:gap-5 min-w-0">
          {/* Identity */}
          <Card title="Admin identity">
            <div className="grid grid-cols-1 sm:grid-cols-[132px_1fr] gap-4 items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full bg-neutral-200 ring-1 ring-neutral-300 overflow-hidden grid place-items-center text-base font-medium text-neutral-600">
                  {form.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(form.firstName[0] || "A") + (form.lastName[0] || "D")}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    <Camera className="w-4 h-4" />
                    Change photo
                  </button>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm hover:bg-neutral-50"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFileChosen(e.target.files?.[0])} />
                <p className="text-[11px] text-neutral-500">JPG/PNG, up to ~2MB.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                <LabeledInput
                  label="Admin ID"
                  value={form.adminId}
                  onChange={(v) => set("adminId", v.trim())}
                  leftIcon={<BadgeCheck className="w-4 h-4 text-neutral-400" />}
                  placeholder="F22-33538"
                />
                <LabeledInput
                  label="Department"
                  value={form.dept}
                  onChange={(v) => set("dept", v)}
                  leftIcon={<Building2 className="w-4 h-4 text-neutral-400" />}
                  placeholder="CCMS"
                />
                <LabeledInput label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} placeholder="Jolo" />
                <LabeledInput label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} placeholder="Santos" />
                <LabeledInput
                  label="Email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  placeholder="admin@example.edu"
                  leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
                  isError={!emailOk}
                  error="Enter a valid email."
                  className="sm:col-span-2"
                />
                <LabeledInput
                  label="Contact number (optional)"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                  placeholder="09XX XXX XXXX"
                  leftIcon={<Phone className="w-4 h-4 text-neutral-400" />}
                  isError={!phoneOk}
                  error="Use digits only (9–11 numbers)."
                  className="sm:col-span-2"
                />
              </div>
            </div>
          </Card>

          {/* Scope */}
          <Card title="Administration scope">
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <LabeledInput
                label="Primary campus"
                value={form.campus}
                onChange={(v) => set("campus", v)}
                leftIcon={<MapPin className="w-4 h-4 text-neutral-400" />}
                placeholder="Lucena"
              />
              <label className="grid gap-1">
                <span className="text-sm text-neutral-700">Campuses managed</span>
                <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5">
                  {["Lucena", "Candelaria", "Saman"].map((c) => {
                    const active = (form.campusesManaged ?? []).includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const current = new Set(form.campusesManaged ?? []);
                          if (current.has(c)) current.delete(c);
                          else current.add(c);
                          set("campusesManaged", Array.from(current));
                        }}
                        className={`px-2.5 py-1.5 rounded-full text-xs ring-1 transition ${
                          active
                            ? "bg-neutral-900 text-white ring-neutral-900"
                            : "bg-white text-neutral-800 ring-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-neutral-700">Auto-assign drivers</span>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5">
                  <ToggleRight className={`w-4 h-4 ${form.autoAssignDrivers ? "text-emerald-600" : "text-neutral-400"}`} />
                  <input
                    type="checkbox"
                    checked={form.autoAssignDrivers}
                    onChange={(e) => set("autoAssignDrivers", e.target.checked)}
                    className="accent-[var(--brand,#7A0010)]"
                  />
                  <span className="text-sm text-neutral-700">Enable smart assignment for approved trips</span>
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-neutral-700">Approval auto‑expire (days)</span>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5">
                  <Clock4 className="w-4 h-4 text-neutral-400" />
                  <input
                    type="number"
                    min={1}
                    className="w-24 outline-none bg-transparent text-sm"
                    value={form.approvalsAutoExpireDays}
                    onChange={(e) => set("approvalsAutoExpireDays", Math.max(1, Number(e.target.value || 1)))}
                  />
                </div>
              </label>
            </div>
          </Card>

          {/* Notifications */}
          <Card title="Notifications">
            <div className="grid gap-4">
              <Toggle
                checked={form.emailNotif}
                onChange={(v) => set("emailNotif", v)}
                label="Email notifications"
                sub="Approvals, schedule changes, incident reports."
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Toggle
                checked={form.pushNotif}
                onChange={(v) => set("pushNotif", v)}
                label="Push notifications"
                sub="Instant alerts for urgent requests and driver updates."
                leftIcon={<Bell className="w-4 h-4" />}
              />
              <Toggle
                checked={form.maintenanceAlerts}
                onChange={(v) => set("maintenanceAlerts", v)}
                label="Maintenance alerts"
                sub="Get notified when vehicles are flagged or return from maintenance."
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              />
              <Toggle
                checked={form.requestDigestDaily}
                onChange={(v) => set("requestDigestDaily", v)}
                label="Daily request digest"
                sub="A morning summary of pending approvals and assignments."
                leftIcon={<Globe className="w-4 h-4" />}
              />
            </div>
          </Card>

          {/* Security */}
          <Card title="Security">
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <Toggle checked={form.twoFAEnabled} onChange={(v) => set("twoFAEnabled", v)} label="Two‑factor authentication" sub="Recommended for all admins." leftIcon={<ShieldCheck className="w-4 h-4" />} />

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 flex items-center gap-3 sm:col-span-2">
                <KeyRound className="w-4 h-4 text-neutral-500" />
                <p className="text-xs text-neutral-600">
                  You’re signed in on 2 devices.{" "}
                  <button type="button" className="inline-flex items-center gap-1 text-xs text-[#7A0010] font-medium hover:underline" onClick={() => alert("Other sessions would be revoked here.")}>
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out of other sessions
                  </button>
                </p>
              </div>

              <LabeledInput
                label="New password"
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={(v) => set("newPassword", v)}
                placeholder="Min 8 characters"
                rightSlot={
                  <button type="button" className="p-1 rounded hover:bg-neutral-50" onClick={() => setShowNew((s) => !s)} aria-label="Toggle password visibility">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <LabeledInput
                label="Confirm new password"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(v) => set("confirmPassword", v)}
                placeholder="Re-enter password"
                isError={!!form.confirmPassword && form.confirmPassword !== form.newPassword}
                error="Passwords must match."
                rightSlot={
                  <button type="button" className="p-1 rounded hover:bg-neutral-50" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle password visibility">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* strength bar */}
              <div className="sm:col-span-2 grid gap-1">
                <div className="h-1 rounded bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${((passStrength.score + 1) / 4) * 100}%`,
                      background: passStrength.score >= 3 ? "#16a34a" : passStrength.score >= 2 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <div className="text-[12px] text-neutral-600">
                  Strength: <span className="font-medium">{passStrength.label}</span>
                  {passStrength.hint && <span className="opacity-80"> — {passStrength.hint}</span>}
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center justify-end">
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-white shadow-sm transition ${
                    form.newPassword && passOk ? "hover:opacity-95" : "bg-neutral-400 cursor-not-allowed"
                  }`}
                  style={{ background: form.newPassword && passOk ? BRAND_MAROON : undefined }}
                  onClick={() => form.newPassword && passOk && setConfirmOpen(true)}
                  disabled={!form.newPassword || !passOk}
                  title="Confirm and apply new password"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm password change
                </button>
              </div>

              <p className="text-[12px] text-neutral-500 sm:col-span-2">Leave password fields blank to keep your current password.</p>
            </div>
          </Card>
        </section>

        {/* right rail */}
        <aside className="col-span-12 md:col-span-3 xl:col-span-3 2xl:col-span-2 grid gap-4 md:gap-5">
          <div className="rounded-2xl text-white p-5 relative overflow-hidden shadow-sm" style={{ background: BRAND_MAROON }}>
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: "url('/euwhite.png')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right -20px center",
                backgroundSize: "360px",
                mixBlendMode: "screen",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 grid place-items-center font-semibold">
                  {(form.firstName[0] || "A").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight truncate">{fullName || "Admin"}</p>
                  <p className="text-xs opacity-90 truncate">ADMIN • {form.dept || "—"} • {form.campus || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-xl bg-white/10 backdrop-blur px-3 py-2 text-center">
                    <div className="text-lg font-semibold">{m.value}</div>
                    <div className="text-[11px] opacity-90">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2">
                  <Search className="w-4 h-4 opacity-80 shrink-0" />
                  <input placeholder="Quick action: note / command…" className="bg-transparent outline-none placeholder:text-white/70 text-sm w-full" />
                </div>
                <div className="flex gap-2">
                  <button className="text-xs bg-white/15 hover:bg-white/20 px-3 py-1.5 rounded-full">Approvals</button>
                  <button className="text-xs bg-white/15 hover:bg-white/20 px-3 py-1.5 rounded-full">Drivers</button>
                  <button className="text-xs bg-white/15 hover:bg-white/20 px-3 py-1.5 rounded-full">Vehicles</button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="font-medium mb-2">Admin tips</p>
            <ul className="text-sm grid gap-2 text-neutral-700">
              <li className="flex gap-2"><Info className="w-4 h-4 mt-0.5 text-neutral-400" />Keep auto‑expire low to reduce stale requests.</li>
              <li className="flex gap-2"><Info className="w-4 h-4 mt-0.5 text-neutral-400" />Use 2FA and revoke old device sessions regularly.</li>
              <li className="flex gap-2"><Info className="w-4 h-4 mt-0.5 text-neutral-400" />Turn on maintenance alerts to catch downtime early.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">Vehicles</p>
              <span className="text-xs text-neutral-500">{vehicles.length}</span>
            </div>
            <div className="mt-3 grid gap-2">
              {vehicles.map((v) => {
                const Icon = iconForType(v.type);
                return (
                  <div key={v.id} className="flex items-center justify-between rounded-xl border border-neutral-200 hover:bg-neutral-50 px-3 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 grid place-items-center rounded-lg bg-neutral-100 shrink-0">
                        <Icon className="w-5 h-5 text-neutral-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{v.name}</div>
                        <div className="text-[11px] text-neutral-500">{v.type}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${pillTone(v.status)}`}>{v.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* Modals */}
      {cropSrc && (
        <CropperModal
          src={cropSrc}
          onClose={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          onSave={(dataUrl) => {
            set("avatar", dataUrl);
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          exportSize={640}
        />
      )}

      <ConfirmPasswordModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirmPassword} twoFAEnabled={form.twoFAEnabled} newPassword={form.newPassword} />

      <AdminProfileToast show={toast.show} text={toast.text} />
    </div>
  );
}
