// src/components/admin/nav/ProfileMenu.tsx
"use client";

import * as React from "react";
import { User } from "lucide-react";
import ProfileSheet from "@/components/admin/profile/ProfileSheet.ui";

type Props = {
  name?: string;
  avatarUrl?: string | null;
};

export default function ProfileMenu({ name = "Profile", avatarUrl }: Props) {
  const [openSheet, setOpenSheet] = React.useState(false);

  return (
    <>
      {/* Trigger (unchanged behavior, now with icon/avatar) */}
      <button
        onClick={() => setOpenSheet(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/60 bg-white/90 px-3 text-sm text-neutral-900 shadow-inner transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70"
        aria-label="Open profile"
        suppressHydrationWarning
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <User className="h-4 w-4" aria-hidden />
        )}
        <span className="hidden sm:inline">{name}</span>
      </button>

      {/* Keep the same sheet + contents */}
      <ProfileSheet open={openSheet} onClose={() => setOpenSheet(false)} />
    </>
  );
}
