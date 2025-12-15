import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Performance: Cache stats for 30 seconds
// Note: API routes are dynamic by default in Next.js 15, but revalidate still works for caching
export const revalidate = 30;

export async function GET() {
  // Use regular client for auth (NOT service role - it doesn't have session info)
  const authSupabase = await createSupabaseServerClient(false);
  // Use service role for database operations
  const supabase = await createSupabaseServerClient(true);

  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, is_hr")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || !profile.is_hr) {
    return NextResponse.json({
      ok: true,
      data: {
        pendingApprovals: 0,
        activeRequests: 0,
        thisMonth: 0,
      }
    });
  }

  const userId = profile.id;

  // Use service role client to bypass RLS for queries
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

  // 1. Pending Count: Requests awaiting HR approval
  // Count both pending_hr requests, with workflow_metadata filtering
  const { data: allPendingRequests } = await supabaseServiceRole
    .from("requests")
    .select("id, status, workflow_metadata")
    .eq("status", "pending_hr")
    .limit(100);

  // Apply same filtering logic as inbox
  const pendingCount = (allPendingRequests || []).filter((req: any) => {
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
    const profileIdStr = String(userId).trim();
    
    const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "hr";

    if (nextHrIdStr || isAssignedViaUniversalId) {
      return (nextHrIdStr === profileIdStr) || isAssignedViaUniversalId;
    }

    return true; // No specific HR assigned - show to all HRs
  }).length;

  // 2. Active Count: Requests submitted by or requested by this HR, not in final states
  const { count: activeCount } = await supabaseServiceRole
    .from("requests")
    .select("*", { count: "exact", head: true })
    .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
    .not("status", "in", "(approved,rejected,cancelled,completed)");

  // 3. Processed This Month: Requests approved by this HR this month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count: processedThisMonth } = await supabaseServiceRole
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("hr_approved_by", userId)
    .gte("hr_approved_at", thisMonthStart.toISOString());

  const response = NextResponse.json({
    ok: true,
    data: {
      pendingApprovals: pendingCount || 0,
      activeRequests: activeCount || 0,
      thisMonth: processedThisMonth || 0,
    }
  });
  // Performance: Add cache headers
  response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return response;
}
