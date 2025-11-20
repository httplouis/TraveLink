"use client";

import { useEffect, useRef, useState } from "react";
import type { DriverProfile } from "@/app/types/driverProfile"; // ✅ correct path
import ProfileView, { type PasswordState } from "@/components/driver/profile/ProfileView"; // ✅ correct path
import { loadProfile, saveProfile, seedFromMock } from "@/lib/data/driverProfile";

export default function DriverProfilePage() {
  const [profile, setProfile] = useState<DriverProfile>(() => {
    // Initialize with default profile, will be replaced by loadProfile in useEffect
    return seedFromMock();
  });
  const [password, setPassword] = useState<PasswordState>({ new: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setProfile(loadProfile()), []);

  const update = <K extends keyof DriverProfile>(key: K, value: DriverProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const toggleCanDrive = (v: string) =>
    setProfile((p) => {
      const has = p.canDrive.includes(v);
      return { ...p, canDrive: has ? p.canDrive.filter((x) => x !== v) : [...p.canDrive, v] };
    });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!profile.firstName.trim()) e.firstName = "Required.";
    if (!profile.lastName.trim()) e.lastName = "Required.";
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = "Invalid email.";
    if (!profile.campus.trim()) e.campus = "Required.";
    if (!profile.license.trim()) e.license = "License is required.";
    if (password.new || password.confirm) {
      if (password.new.length < 8) e.passwordNew = "Min 8 characters.";
      if (password.new !== password.confirm) e.passwordConfirm = "Passwords do not match.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 650)); // simulate API
    saveProfile(profile);
    setSaving(false);
    setSavedAt(new Date().toLocaleString());
    setPassword({ new: "", confirm: "" });
  }

  const onAvatarFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("avatar", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <ProfileView
      profile={profile}
      errors={errors}
      password={password}
      saving={saving}
      savedAt={savedAt}
      fileInputRef={fileRef}
      onSubmit={onSubmit}
      onChange={update}
      onToggleCanDrive={toggleCanDrive}
      onPasswordChange={(patch) => setPassword((p) => ({ ...p, ...patch }))}
      onAvatarFile={onAvatarFile}
    />
  );
}
