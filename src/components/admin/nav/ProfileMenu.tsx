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
        className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-[#7a0019] shadow transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Open profile"
        suppressHydrationWarning
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-6 w-6 rounded-full object-cover ring-2 ring-[#7a0019]/20"
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
