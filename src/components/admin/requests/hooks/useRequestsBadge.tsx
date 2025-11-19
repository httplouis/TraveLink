"use client";

import * as React from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export function useRequestsNavBadge() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const supabase = createSupabaseClient();
    
    const fetchPendingCount = async () => {
      try {
        // Optimized: Use count query with WHERE clauses instead of fetching all rows
        // Count requests waiting for ADMIN action where admin hasn't acted yet
        // Focus on the main pending statuses that need admin action
        
        const { count, error } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending_head", "pending_admin"])
          .is("admin_approved_at", null)
          .is("admin_approved_by", null);

        if (error) {
          console.error("[useRequestsNavBadge] ❌ Query error:", error);
          console.error("[useRequestsNavBadge] Error details:", JSON.stringify(error, null, 2));
          setCount(0);
          return;
        }

        const totalCount = count || 0;
        console.log("[useRequestsNavBadge] ✅ Success! Admin pending requests:", totalCount);
        
        setCount(totalCount);
      } catch (error) {
        console.error("[useRequestsNavBadge] ⚠️ Caught error:", error);
        setCount(0);
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
