"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProfileRepo } from "@/lib/user/profileRepo";
import type { UserProfile } from "@/lib/user/types";
import { AuthRepo } from "@/lib/auth/repo";

type Params = { open: boolean; onClose: () => void };
type Errors = Partial<Record<keyof UserProfile | "phone", string>>;

export function useProfileSheet({ open, onClose }: Params) {
  const router = useRouter();

  const [orig, setOrig] = React.useState<UserProfile | null>(null);
  const [draft, setDraft] = React.useState<UserProfile | null>(null);
  const [errors, setErrors] = React.useState<Errors>({});

  const [showLogout, setShowLogout] = React.useState(false);
  const [confirmSave, setConfirmSave] = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      const p = await ProfileRepo.load();
      if (!mounted) return;
      const profile = p ?? ProfileRepo.defaults("jolo@example.edu");
      setOrig(profile);
      setDraft(profile);
      setErrors(validate(profile));
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  function validate(p: UserProfile): Errors {
    const e: Errors = {};
    if (!p.firstName?.trim()) e.firstName = "First name is required.";
    if (!p.lastName?.trim()) e.lastName = "Last name is required.";
    if (!p.email?.trim()) e.email = "Email is required.";
    if (p.phone && !/^(09\d{9}|(\+?63)9\d{9})$/.test(p.phone))
      e.phone = "Use PH format: 09XXXXXXXXX or +639XXXXXXXXX.";
    return e;
  }

  function fullName(p: UserProfile | null) {
    if (!p) return "";
    const n = [p.firstName, p.lastName].filter(Boolean).join(" ");
    return n || p.email;
  }

  function fmtJoined(p?: string) {
    if (!p) return "—";
    const d = new Date(p);
    return isNaN(+d)
      ? "—"
      : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function setField<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    if (!draft) return;
    const next = { ...draft, [k]: v };
    setDraft(next);
    setErrors(validate(next));
  }

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !draft) return;
    const url = URL.createObjectURL(f);
    setField("avatarUrl", url as any);
  }

  const isDirty = React.useMemo(() => {
    if (!orig || !draft) return false;
    const keys: (keyof UserProfile)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "department",
      "employeeId",
      "avatarUrl",
      "joinedAt",
    ];
    return keys.some((k) => (orig as any)?.[k] !== (draft as any)?.[k]);
  }, [orig, draft]);

  const isInvalid = Object.keys(errors).length > 0;

  async function reallySave() {
    if (!draft) return;
    await ProfileRepo.save(draft);
    setOrig(draft);
    setConfirmSave(false);
    onClose();
  }

  function requestSave() {
    if (isInvalid || !isDirty) return;
    setConfirmSave(true);
  }

  function requestClose() {
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  }

  function reallyDiscard() {
    setConfirmDiscard(false);
    setDraft(orig);
    onClose();
  }

  async function doLogout() {
    setShowLogout(false);
    await AuthRepo.signOut();
    onClose();
    router.replace("/login");
  }

  function resetToOrig() {
    if (!orig) return;
    setDraft(orig);
    setErrors(validate(orig));
  }

  return {
    // state
    orig,
    draft,
    errors,
    isDirty,
    isInvalid,
    showLogout,
    confirmSave,
    confirmDiscard,
    // formatters
    fullName,
    fmtJoined,
    // setters/flags
    setShowLogout,
    setConfirmSave,
    setConfirmDiscard,
    // handlers/actions
    setField,
    onAvatarPick,
    requestClose,
    requestSave,
    reallySave,
    reallyDiscard,
    doLogout,
    resetToOrig,
  };
}
