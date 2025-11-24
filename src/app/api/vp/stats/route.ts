// src/app/api/vp/stats/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering (uses cookies - must be dynamic)
export const dynamic = 'force-dynamic';
// Note: revalidate doesn't work with force-dynamic, so we use Cache-Control headers instead

/**
 * GET /api/vp/stats
 * Get real-time dashboard statistics for VP
 */
export async function GET() {
  try {
    // Get authenticated user first (for authorization)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use direct createClient for service role to truly bypass RLS for queries
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    // Service role client for queries (bypasses RLS completely)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

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
      .not("status", "in", "(approved,rejected,cancelled,completed)");

    // 3. This Month: Requests approved by this VP this month
    const { count: thisMonth } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`vp_approved_by.eq.${userId},vp2_approved_by.eq.${userId}`)
      .gte("vp_approved_at", thisMonthStart.toISOString())
      .or(`vp_approved_at.gte.${thisMonthStart.toISOString()},vp2_approved_at.gte.${thisMonthStart.toISOString()}`);

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
    console.error("[GET /api/vp/stats] Error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message || "Failed to fetch stats" 
    }, { status: 500 });
  }
}

