// src/app/(protected)/user/activity/page.tsx
"use client";

import RoleActivityPage from "@/components/common/RoleActivityPage";

export default function UserActivityPage() {
  return <RoleActivityPage detailsBasePath="/user/submissions" />;
}
