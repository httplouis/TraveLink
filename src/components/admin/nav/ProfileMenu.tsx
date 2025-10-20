"use client";

import * as React from "react";
import { User } from "lucide-react";
import ProfileSheet from "@/components/admin/profile/ProfileSheet.ui";

export default function ProfileMenu() {
  const [openSheet, setOpenSheet] = React.useState(false);

  return (
    <>
      {/* Trigger (replace with your existing avatar button if you have one) */}
      <button
        onClick={() => setOpenSheet(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 text-sm hover:bg-neutral-50"
        aria-label="Open profile"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Profile</span>
      </button>

      <ProfileSheet open={openSheet} onClose={() => setOpenSheet(false)} />
    </>
  );
}
