import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/president/inbox/count
 * Lightweight count-only endpoint for badge polling (reduces egress)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check President status and get profile ID
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_president")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_president) {
      return NextResponse.json({ ok: true, pending_count: 0 });
    }

    // Count pending requests for President
    // President reviews:
    // 1. Requests with status = pending_exec where both VPs have approved (both_vps_approved = true)
    // 2. Requests with status = pending_president (legacy)
    // 3. Requests with workflow_metadata.next_president_id matching this President
    const { data: allRequests, error } = await supabase
      .from("requests")
      .select("id, status, workflow_metadata, both_vps_approved, president_approved_at")
      .or(`and(status.eq.pending_exec,both_vps_approved.eq.true),status.eq.pending_president`)
      .is("president_approved_at", null)
      .limit(100);

    if (error) {
      console.error("President inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Filter by workflow_metadata if specific President is assigned
    const filteredRequests = (allRequests || []).filter((req: any) => {
      const workflowMetadata = req.workflow_metadata || {};
      let nextPresidentId = null;
      let nextApproverId = null;
      let nextApproverRole = null;
      
      if (typeof workflowMetadata === 'string') {
        try {
          const parsed = JSON.parse(workflowMetadata);
          nextPresidentId = parsed?.next_president_id;
          nextApproverId = parsed?.next_approver_id;
          nextApproverRole = parsed?.next_approver_role;
        } catch (e) {
          // Ignore parse errors
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextPresidentId = workflowMetadata?.next_president_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }

      const nextPresidentIdStr = nextPresidentId ? String(nextPresidentId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = String(profile.id).trim();
      
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "president";

      if (nextPresidentIdStr || isAssignedViaUniversalId) {
        return (nextPresidentIdStr === profileIdStr) || isAssignedViaUniversalId;
      }

      return true; // No specific assignment - show to all Presidents
    });

    return NextResponse.json({ ok: true, pending_count: filteredRequests.length });
  } catch (err: any) {
    console.error("President inbox count error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

