"use client";

import * as React from "react";

export function useRequestsNavBadge() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    
    const fetchPendingCount = async () => {
      try {
        // Use API endpoint instead of direct Supabase query to avoid RLS issues
        const response = await fetch("/api/admin/inbox/count", { 
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!mounted) return;
        
        if (!response.ok) {
          console.warn("[useRequestsNavBadge] ⚠️ API response not OK:", response.status, response.statusText);
          setCount(0);
          return;
        }

        const result = await response.json();
        
        if (!mounted) return;
        
        if (result.ok) {
          const totalCount = result.count || 0;
          console.log("[useRequestsNavBadge] ✅ Success! Admin pending requests:", totalCount);
          setCount(totalCount);
        } else {
          console.warn("[useRequestsNavBadge] ⚠️ API returned error:", result.error);
          setCount(0);
        }
      } catch (error: any) {
        if (!mounted) return;
        // Silently handle network errors - don't spam console
        // Only log if it's not a network error (which is expected during development)
        if (error?.message && !error.message.includes("Failed to fetch")) {
          console.error("[useRequestsNavBadge] ⚠️ Error fetching count:", error);
        }
        setCount(0);
      }
    };

    // Initial fetch
    fetchPendingCount();

    // Poll every 30 seconds
    const id = setInterval(fetchPendingCount, 30000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return count;
}
