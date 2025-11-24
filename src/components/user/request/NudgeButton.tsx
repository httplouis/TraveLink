// src/components/user/request/NudgeButton.tsx
"use client";

import * as React from "react";
import { Bell, Clock } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

interface NudgeButtonProps {
  requestId: string;
  requestStatus: string;
  requestCreatedAt: string;
  currentApprover?: {
    role: string;
    name?: string;
  };
  onNudged?: () => void;
}

export default function NudgeButton({
  requestId,
  requestStatus,
  requestCreatedAt,
  currentApprover,
  onNudged,
}: NudgeButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [nudged, setNudged] = React.useState(false);
  const toast = useToast();

  // Only show for pending requests
  if (!requestStatus.startsWith("pending_")) {
    return null;
  }

  // Calculate days pending
  const daysPending = React.useMemo(() => {
    const created = new Date(requestCreatedAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }, [requestCreatedAt]);

  const handleNudge = async () => {
    if (loading || nudged) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/requests/${requestId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result.ok) {
        setNudged(true);
        toast.success(`Reminder sent to ${result.data?.approver_role || "approver"}`);
        if (onNudged) onNudged();
      } else {
        toast.error(result.error || "Failed to send reminder");
      }
    } catch (error: any) {
      console.error("[NudgeButton] Error:", error);
      toast.error("Failed to send reminder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Determine approver info
  const approverRole = currentApprover?.role || 
    (requestStatus === "pending_head" ? "Department Head" :
     requestStatus === "pending_admin" ? "Admin" :
     requestStatus === "pending_comptroller" ? "Comptroller" :
     requestStatus === "pending_hr" ? "HR" :
     requestStatus === "pending_exec" || requestStatus === "pending_vp" ? "VP" :
     requestStatus === "pending_president" ? "President" : "Approver");

  return (
    <button
      onClick={handleNudge}
      disabled={loading || nudged}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${nudged 
          ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
          : loading
          ? "bg-blue-100 text-blue-700 cursor-wait"
          : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
        }
      `}
      title={nudged ? "Reminder already sent (max 1 per 24 hours)" : `Send reminder to ${approverRole}`}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Sending...</span>
        </>
      ) : nudged ? (
        <>
          <Clock className="w-4 h-4" />
          <span>Reminder Sent</span>
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          <span>Send Reminder</span>
          {daysPending > 0 && (
            <span className="text-xs opacity-75">({daysPending}d pending)</span>
          )}
        </>
      )}
    </button>
  );
}

