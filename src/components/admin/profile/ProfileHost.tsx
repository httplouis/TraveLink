"use client";

import * as React from "react";
import { useProfilePanel } from "@/lib/admin/profile/store";
import ProfileSheet from "@/components/admin/profile/ui/ProfileSheet.ui";

export default function ProfilePanelHost() {
  const { open, closePanel } = useProfilePanel();
  return <ProfileSheet open={open} onClose={closePanel} />;
}
