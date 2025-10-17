// src/components/admin/requests/hooks/useRequestsBadge.tsx
"use client";

import * as React from "react";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { computeNavBadgeCount } from "@/lib/admin/requests/notifs";

export function useRequestsNavBadge() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const tick = () => {
      const list = AdminRequestsRepo.list();
      setCount(computeNavBadgeCount(list.map((r) => ({ id: r.id, createdAt: r.createdAt }))));
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  return count;
}
