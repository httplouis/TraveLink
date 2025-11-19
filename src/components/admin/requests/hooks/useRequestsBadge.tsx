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
        // Count only requests where admin hasn't acted yet (same logic as pending filter)
        const { data, error } = await supabase
          .from("requests")
          .select("id, status, request_number, admin_approved_at, admin_approved_by");

        if (error) {
          console.error("[useRequestsNavBadge] ❌ Query error:", error);
          console.error("[useRequestsNavBadge] Error details:", JSON.stringify(error, null, 2));
          setCount(0);
          return;
        }

        // Filter: Only count requests where admin hasn't acted yet
        const pendingRequests = (data || []).filter((r: any) => {
          // Check if admin has already acted on this request
          const adminActed = !!(r.admin_approved_at || r.admin_approved_by);
          
          // If admin already acted, don't count it
          if (adminActed) {
            return false;
          }
          
          // Only count requests that are waiting for admin action
          const isWaitingForAdmin = [
            "pending_head",
            "pending_admin"
          ].includes(r.status);
          
          // Also include requests that are in pending state but admin hasn't acted yet
          // Exclude final states (approved, rejected, completed)
          const isNotFinalState = ![
            "approved",
            "rejected", 
            "completed"
          ].includes(r.status);
          
          return isWaitingForAdmin || (isNotFinalState && !adminActed);
        });

        const count = pendingRequests.length;
        console.log("[useRequestsNavBadge] ✅ Success! Admin pending requests:", count);
        if (count > 0) {
          console.log("[useRequestsNavBadge] 📋 Request IDs:", pendingRequests.map((r: any) => r.request_number).join(", "));
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
