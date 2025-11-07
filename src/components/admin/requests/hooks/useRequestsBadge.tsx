"use client";

import * as React from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export function useRequestsNavBadge() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const supabase = createSupabaseClient();
    
    const fetchPendingCount = async () => {
      try {
        // Fetch requests waiting for ADMIN action
        // Status: pending_admin = after head approval, waiting for admin (Ma'am TM) to process
        const { data, error } = await supabase
          .from("requests")
          .select("id, status, request_number")
          .eq("status", "pending_admin");

        if (error) {
          console.error("[useRequestsNavBadge] ❌ Query error:", error);
          console.error("[useRequestsNavBadge] Error details:", JSON.stringify(error, null, 2));
          setCount(0);
          return;
        }

        const count = data?.length || 0;
        console.log("[useRequestsNavBadge] ✅ Success! Admin pending requests:", count);
        if (count > 0) {
          console.log("[useRequestsNavBadge] 📋 Request IDs:", data?.map(r => r.request_number).join(", "));
        }
        
        setCount(count);
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
