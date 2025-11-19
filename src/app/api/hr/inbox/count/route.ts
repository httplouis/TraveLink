import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/hr/inbox/count
 * Lightweight endpoint to get the count of pending requests for HR
 * Includes workflow_metadata filtering for specific HR assignments
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    // Get current user profile for filtering
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, is_hr")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_hr) {
      return NextResponse.json({ ok: true, pending_count: 0 });
    }

    // Fetch all pending HR requests
    const { data: allRequests, error } = await supabase
      .from("requests")
      .select("id, status, workflow_metadata")
      .eq("status", "pending_hr")
      .limit(100);

    if (error) {
      console.error("[HR Inbox Count] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Filter by workflow_metadata if specific HR is assigned
    const filteredRequests = (allRequests || []).filter((req: any) => {
      const workflowMetadata = req.workflow_metadata || {};
      let nextHrId = null;
      let nextApproverId = null;
      let nextApproverRole = null;
      
      if (typeof workflowMetadata === 'string') {
        try {
          const parsed = JSON.parse(workflowMetadata);
          nextHrId = parsed?.next_hr_id;
          nextApproverId = parsed?.next_approver_id;
          nextApproverRole = parsed?.next_approver_role;
        } catch (e) {
          // Ignore parse errors
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextHrId = workflowMetadata?.next_hr_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }

      const nextHrIdStr = nextHrId ? String(nextHrId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = String(profile.id).trim();
      
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "hr";

      if (nextHrIdStr || isAssignedViaUniversalId) {
        return (nextHrIdStr === profileIdStr) || isAssignedViaUniversalId;
      }

      return true; // No specific assignment - show to all HRs
    });

    return NextResponse.json({ ok: true, pending_count: filteredRequests.length });
  } catch (err) {
    console.error("[HR Inbox Count] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch HR inbox count" },
      { status: 500 }
    );
  }
}
