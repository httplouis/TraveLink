"use client";

import { useState } from "react";
import ProfileView, {
  ProfileData,
  PasswordState,
  ProfileErrors,
} from "@/components/user/profile/ProfileView";

export default function UserProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "Jolo",
    lastName: "Santos",
    email: "jolo@example.edu",
    department: "CCMS",
    campus: "Lucena",
    phone: "09XX XXX XXXX",
    avatar: undefined,     // later: fill from DB/CDN
    notifyEmail: true,
    notifyPush: true,
  });

  const [password, setPassword] = useState<PasswordState>({ new: "", confirm: "" });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validate(): boolean {
    const e: ProfileErrors = {};
    if (!profile.firstName.trim()) e.firstName = "Required.";
    if (!profile.lastName.trim()) e.lastName = "Required.";
    if (!isValidEmail(profile.email)) e.email = "Invalid email.";
    if (!profile.department.trim()) e.department = "Required.";
    if (!profile.campus.trim()) e.campus = "Required.";
    if (password.new || password.confirm) {
      if (password.new.length < 8) e.passwordNew = "Min 8 characters.";
      if (password.new !== password.confirm) e.passwordConfirm = "Passwords do not match.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;

    setSaving(true);
    // TODO: call your API / Supabase
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSavedAt(new Date().toLocaleString());
    setPassword({ new: "", confirm: "" });
  }

  function onReset() {
    setProfile((p) => ({
      ...p,
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      campus: "",
      phone: "",
      // keep avatar & notification prefs
    }));
    setPassword({ new: "", confirm: "" });
    setErrors({});
  }

  function onChangePassword(patch: Partial<PasswordState>) {
    setPassword((prev) => ({ ...prev, ...patch }));
  }

  function onAvatarChange(file?: File) {
    if (!file) return;
    // Preview locally (data URL). Replace this with upload to storage/CDN later.
    const reader = new FileReader();
    reader.onload = () => update("avatar", String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <ProfileView
      profile={profile}
      password={password}
      saving={saving}
      savedAt={savedAt}
      errors={errors}
      onChangeProfile={update}
      onChangePassword={onChangePassword}
      onAvatarChange={onAvatarChange}
      onSubmit={onSubmit}
      onReset={onReset}
    />
  );
}
