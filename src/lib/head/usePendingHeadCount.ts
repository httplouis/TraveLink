"use client";

import * as React from "react";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";

export function usePendingHeadCount() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const refresh = () => {
      const n = AdminRequestsRepo
        .list()
        .filter(r => r.status === "pending_head")
        .length;
      setCount(n);
    };
    refresh();
    const unsub = AdminRequestsRepo.subscribe(refresh);
    return () => { unsub(); };
  }, []);

  return count;
}
