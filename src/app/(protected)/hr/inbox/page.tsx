"use client";

import React from "react";
import { Clock, History, CheckCircle2, XCircle } from "lucide-react";
import HRInboxContainer from "@/components/hr/inbox/InboxContainer";
import HRHistoryContainer from "@/components/hr/inbox/HistoryContainer";

export default function HRInboxPage() {
  const [activeTab, setActiveTab] = React.useState<"pending" | "history">("pending");
  const [pendingCount, setPendingCount] = React.useState(0);

  // Fetch pending count
  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/hr/inbox/count", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setPendingCount(data.pending_count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch count:", err);
      }
    };
    
    fetchCount();
    const interval = setInterval(fetchCount, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

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
          <span>Pending Requests</span>
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
        <HRInboxContainer />
      ) : (
        <HRHistoryContainer />
      )}
    </div>
  );
}
