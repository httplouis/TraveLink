"use client";

import * as React from "react";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { computeNavBadgeCount } from "@/lib/admin/requests/notifs";

export function useRequestsNavBadge() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const tick = () => {
      const list = AdminRequestsRepo.list();
      setCount(computeNavBadgeCount(list));
    };

    tick();

    // update when repo changes + little poll fallback
    const unsub = AdminRequestsRepo.subscribe?.(() => {
      tick();
      return true;
    });
    const id = setInterval(tick, 1500);

    return () => {
      clearInterval(id);
      unsub?.();
    };
  }, []);

  return count;
}
