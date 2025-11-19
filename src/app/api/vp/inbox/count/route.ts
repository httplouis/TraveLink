import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/vp/inbox/count
 * Lightweight count-only endpoint for badge polling (reduces egress)
 * Counts both pending_exec and pending_head requests assigned to this VP
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check VP status and get profile ID
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_vp) {
      return NextResponse.json({ ok: true, pending_count: 0 });
    }

    // Fetch both pending_exec and pending_head requests
    const { data: allRequests, error } = await supabase
      .from("requests")
      .select("id, status, workflow_metadata, vp_approved_by, vp2_approved_by, parent_head_approved_at, parent_head_approved_by")
      .or(`status.eq.pending_exec,status.eq.pending_head`)
      .limit(100);

    if (error) {
      console.error("[VP Inbox Count] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Apply same filtering logic as inbox
    const filteredRequests = (allRequests || []).filter((req: any) => {
      // Skip if parent head VP already signed
      if (req.parent_head_approved_at) {
        return false;
      }

      const workflowMetadata = req.workflow_metadata || {};
      const nextVpId = workflowMetadata?.next_vp_id;
      const nextApproverId = workflowMetadata?.next_approver_id;
      const nextApproverRole = workflowMetadata?.next_approver_role;
      
      // Universal fallback: If next_approver_id matches and role is vp, count it
      const isAssignedViaUniversalId = nextApproverId === profile.id && nextApproverRole === "vp";

      // If request is pending_head with next_vp_id or next_approver_id, only count if assigned to this VP
      if (req.status === 'pending_head' && (nextVpId || isAssignedViaUniversalId)) {
        return (nextVpId === profile.id) || isAssignedViaUniversalId;
      }

      // For pending_exec requests
      if (req.status === 'pending_exec') {
        if (nextVpId || isAssignedViaUniversalId) {
          // Assigned to specific VP - only count if it's this VP
          return (nextVpId === profile.id) || isAssignedViaUniversalId;
        }
        // No specific VP assigned - count if no VP approved or first VP approved but second hasn't
        const noVPApproved = !req.vp_approved_by;
        const firstVPApproved = req.vp_approved_by && !req.vp2_approved_by && req.vp_approved_by !== profile.id;
        return noVPApproved || firstVPApproved;
      }

      return false;
    });

    return NextResponse.json({ ok: true, pending_count: filteredRequests.length });
  } catch (err: any) {
    console.error("[VP Inbox Count] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

