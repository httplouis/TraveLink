// src/app/api/president/stats/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

/**
 * GET /api/president/stats
 * Get real-time dashboard statistics for President
 */
export async function GET() {
  try {
    // Use regular client for auth (NOT service role - it doesn't have session info)
    const authSupabase = await createSupabaseServerClient(false);
    // Use service role for database operations
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_president")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_president) {
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

    // 1. Pending Approvals: Requests awaiting President approval
    // President reviews:
    // - Requests with status = pending_exec where both VPs have approved (both_vps_approved = true)
    // - Requests with status = pending_president (legacy)
    // - Requests with workflow_metadata.next_president_id matching this President
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const { data: allPendingRequests } = await supabaseServiceRole
      .from("requests")
      .select("id, status, workflow_metadata, both_vps_approved, president_approved_at")
      .or(`and(status.eq.pending_exec,both_vps_approved.eq.true),status.eq.pending_president`)
      .is("president_approved_at", null)
      .limit(100);

    // Filter by workflow_metadata if specific President is assigned
    const pendingApprovals = (allPendingRequests || []).filter((req: any) => {
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
      const profileIdStr = String(userId).trim();
      
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "president";

      if (nextPresidentIdStr || isAssignedViaUniversalId) {
        return (nextPresidentIdStr === profileIdStr) || isAssignedViaUniversalId;
      }

      return true; // No specific assignment - show to all Presidents
    }).length;

    // 2. Active Requests: Requests submitted by or requested by this President, not in final states
    // Use service role client to bypass RLS (already created above)
    const { count: activeRequests } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(approved,rejected,cancelled,completed)");

    // 3. This Month: Requests approved by this President this month
    const { count: thisMonth } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`president_approved_by.eq.${userId},exec_approved_by.eq.${userId}`)
      .gte("president_approved_at", thisMonthStart.toISOString());

    const response = NextResponse.json({
      ok: true,
      data: {
        pendingApprovals: pendingApprovals || 0,
        activeRequests: activeRequests || 0,
        thisMonth: thisMonth || 0
      }
    });
    // Performance: Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (err: any) {
    console.error("[GET /api/president/stats] Error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message || "Failed to fetch stats" 
    }, { status: 500 });
  }
}

