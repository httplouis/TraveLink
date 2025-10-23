"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/common/confirm/ConfirmDialog";
import { ProfileRepo } from "@/lib/user/profileRepo";
import type { UserProfile } from "@/lib/user/types";
import { AuthRepo } from "@/lib/auth/repo";

export default function ProfileContainer() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const p = await ProfileRepo.load();
      setProfile(p ?? ProfileRepo.defaults("jolo@example.edu"));
    })();
  }, []);

  async function onSave(next: UserProfile) {
    await ProfileRepo.save(next);
    setProfile(next);
  }

  function onReset() {
    const email = profile?.email ?? "user@example.edu";
    const d = ProfileRepo.defaults(email);
    setProfile(d);
  }

  async function onLogoutConfirm() {
    setConfirmLogout(false);
    await AuthRepo.signOut();
    router.replace("/login");
  }

  if (!profile) return null;

  return (
    <>

      <ConfirmDialog
        open={confirmLogout}
        title="Sign out"
        message="Are you sure you want to logout of your account?"
        confirmLabel="Logout"
        cancelLabel="Stay"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={onLogoutConfirm}
      />
    </>
  );
}
