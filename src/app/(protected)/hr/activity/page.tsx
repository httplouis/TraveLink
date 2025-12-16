// src/app/(protected)/hr/activity/page.tsx
"use client";

import RoleActivityPage from "@/components/common/RoleActivityPage";

export default function HRActivityPage() {
  return <RoleActivityPage detailsBasePath="/hr/inbox" />;
}
