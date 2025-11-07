"use client";

import * as React from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export function useRequestsNavBadge() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const supabase = createSupabaseClient();
    
    const fetchPendingCount = async () => {
      try {
        // Count requests that need admin attention
        const { count: pendingCount } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .in("status", [
            "head_approved",
            "pending_admin",
            "admin_received",
            "comptroller_pending",
            "hr_pending",
            "executive_pending"
          ]);

        setCount(pendingCount || 0);
      } catch (error) {
        console.error("[useRequestsNavBadge] Error fetching count:", error);
      }
    };

    // Initial fetch
    fetchPendingCount();

    // Set up real-time subscription
    console.log("[useRequestsNavBadge] Setting up real-time subscription...");
    const channel = supabase
      .channel("badge-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "requests",
        },
        (payload) => {
          console.log("[useRequestsNavBadge] Change detected, refetching count...");
          fetchPendingCount();
        }
      )
      .subscribe((status) => {
        console.log("[useRequestsNavBadge] Subscription status:", status);
      });

    // Also poll every 30 seconds as backup
    const id = setInterval(fetchPendingCount, 30000);

    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
