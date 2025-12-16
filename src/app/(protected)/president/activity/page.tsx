// src/app/(protected)/president/activity/page.tsx
"use client";

import RoleActivityPage from "@/components/common/RoleActivityPage";

export default function PresidentActivityPage() {
  return <RoleActivityPage detailsBasePath="/president/inbox" />;
}
