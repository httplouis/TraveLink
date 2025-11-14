"use client";

import React from "react";
import { Clock, History } from "lucide-react";
import ExecInboxContainer from "@/components/exec/inbox/InboxContainer";
import ExecHistoryContainer from "@/components/exec/inbox/HistoryContainer";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function ExecInboxPage() {
  const [activeTab, setActiveTab] = React.useState<"pending" | "history">("pending");
  const [pendingCount, setPendingCount] = React.useState(0);

  // Fetch pending count with real-time updates
  React.useEffect(() => {
    let isMounted = true;
    
    const fetchCount = async () => {
      if (!isMounted) return;
      try {
        const res = await fetch("/api/exec/inbox/count", { cache: "no-store" });
        const data = await res.json();
        if (data.ok && isMounted) {
          setPendingCount(data.pending_count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch count:", err);
      }
    };
    
    fetchCount();
    
    // Set up real-time subscription for count
    const supabase = createSupabaseClient();
    console.log("[ExecInboxPage] Setting up real-time count subscription...");
    
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("exec-inbox-count-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          if (!isMounted) return;
          
          const newStatus = (payload.new as any)?.status;
          const oldStatus = (payload.old as any)?.status;
          
          // Only react to changes that affect exec inbox statuses
          const execStatuses = ['pending_vp', 'pending_president', 'pending_exec', 'approved', 'rejected'];
          if (execStatuses.includes(newStatus) || execStatuses.includes(oldStatus)) {
            console.log("[ExecInboxPage] 🔄 Real-time count change detected:", newStatus);
            
            // Debounce: only trigger refetch after 500ms
            if (mutateTimeout) clearTimeout(mutateTimeout);
            mutateTimeout = setTimeout(() => {
              if (isMounted) {
                console.log("[ExecInboxPage] ⚡ Refetching count");
                fetchCount();
              }
            }, 500);
          }
        }
      )
      .subscribe((status) => {
        console.log("[ExecInboxPage] Count subscription status:", status);
      });

    // Cleanup
    return () => {
      isMounted = false;
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
    };
  }, []); // Empty deps - only run once on mount

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
            ${activeTab === "pending"
              ? "bg-[#7A0010] text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }
          `}
        >
          <Clock className="h-5 w-5" />
          <span>Pending Final Approval</span>
          {pendingCount > 0 && (
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-bold
              ${activeTab === "pending" ? "bg-white text-[#7A0010]" : "bg-[#7A0010] text-white"}
            `}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
            ${activeTab === "history"
              ? "bg-[#7A0010] text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }
          `}
        >
          <History className="h-5 w-5" />
          <span>History</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "pending" ? (
        <ExecInboxContainer />
      ) : (
        <ExecHistoryContainer />
      )}
    </div>
  );
}
