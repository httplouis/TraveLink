// src/app/api/vp/stats/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/vp/stats
 * Get real-time dashboard statistics for VP
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_vp) {
      return NextResponse.json({
        ok: true,
        data: {
          pendingApprovals: 0,
          activeRequests: 0,
          thisMonth: 0
        }
      });
    }

    const userId = profile.id;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Pending Approvals: Requests awaiting VP approval
    // Count both pending_exec and pending_head requests assigned to this VP
    const { data: allPendingRequests } = await supabase
      .from("requests")
      .select("id, status, workflow_metadata, vp_approved_by, vp2_approved_by, parent_head_approved_at")
      .or(`status.eq.pending_exec,status.eq.pending_head`)
      .limit(100);

    // Apply same filtering logic as inbox
    const pendingApprovals = (allPendingRequests || []).filter((req: any) => {
      // Skip if parent head VP already signed
      if (req.parent_head_approved_at) {
        return false;
      }

      const workflowMetadata = req.workflow_metadata || {};
      const nextVpId = workflowMetadata?.next_vp_id;
      const nextApproverId = workflowMetadata?.next_approver_id;
      const nextApproverRole = workflowMetadata?.next_approver_role;
      
      const isAssignedViaUniversalId = nextApproverId === userId && nextApproverRole === "vp";

      if (req.status === 'pending_head' && (nextVpId || isAssignedViaUniversalId)) {
        return (nextVpId === userId) || isAssignedViaUniversalId;
      }

      if (req.status === 'pending_exec') {
        if (nextVpId || isAssignedViaUniversalId) {
          return (nextVpId === userId) || isAssignedViaUniversalId;
        }
        const noVPApproved = !req.vp_approved_by;
        const firstVPApproved = req.vp_approved_by && !req.vp2_approved_by && req.vp_approved_by !== userId;
        return noVPApproved || firstVPApproved;
      }

      return false;
    }).length;

    // 2. Active Requests: Requests submitted by or requested by this VP, not in final states
    const { count: activeRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(approved,rejected,cancelled)");

    // 3. This Month: Requests approved by this VP this month
    const { count: thisMonth } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`vp_approved_by.eq.${userId},vp2_approved_by.eq.${userId}`)
      .gte("vp_approved_at", thisMonthStart.toISOString())
      .or(`vp_approved_at.gte.${thisMonthStart.toISOString()},vp2_approved_at.gte.${thisMonthStart.toISOString()}`);

    return NextResponse.json({
      ok: true,
      data: {
        pendingApprovals: pendingApprovals || 0,
        activeRequests: activeRequests || 0,
        thisMonth: thisMonth || 0
      }
    });
  } catch (err: any) {
    console.error("[GET /api/vp/stats] Error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message || "Failed to fetch stats" 
    }, { status: 500 });
  }
}

