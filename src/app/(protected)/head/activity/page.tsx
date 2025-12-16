// src/app/(protected)/head/activity/page.tsx
"use client";

import RoleActivityPage from "@/components/common/RoleActivityPage";
import * as React from "react";

export default function HeadActivityPage() {
  React.useEffect(() => {
    console.log("[HeadActivityPage] Component mounted");
  }, []);
  
  return <RoleActivityPage detailsBasePath="/head/inbox" />;
}
