import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/inbox/count
 * Lightweight endpoint to get the count of pending requests for Admin
 * Includes workflow_metadata filtering for specific admin assignments
 */
export async function GET() {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    
    // Get current user profile for filtering
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role for queries (bypasses RLS)
    const supabase = await createSupabaseServerClient(true);

    const { data: profile } = await supabase
      .from("users")
      .select("id, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // Fetch all pending admin requests
    const { data: allRequests, error } = await supabase
      .from("requests")
      .select("id, status, workflow_metadata")
      .in("status", ["pending_admin", "head_approved"])
      .limit(100);

    if (error) {
      console.error("[Admin Inbox Count] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Filter by workflow_metadata if specific admin is assigned
    const filteredRequests = (allRequests || []).filter((req: any) => {
      const workflowMetadata = req.workflow_metadata || {};
      let nextAdminId = null;
      let nextApproverId = null;
      let nextApproverRole = null;
      
      if (typeof workflowMetadata === 'string') {
        try {
          const parsed = JSON.parse(workflowMetadata);
          nextAdminId = parsed?.next_admin_id;
          nextApproverId = parsed?.next_approver_id;
          nextApproverRole = parsed?.next_approver_role;
        } catch (e) {
          // Ignore parse errors
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextAdminId = workflowMetadata?.next_admin_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }

      const nextAdminIdStr = nextAdminId ? String(nextAdminId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = String(profile.id).trim();
      
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "admin";

      if (nextAdminIdStr || isAssignedViaUniversalId) {
        return (nextAdminIdStr === profileIdStr) || isAssignedViaUniversalId;
      }

      return true; // No specific assignment - show to all admins
    });

    return NextResponse.json({ ok: true, count: filteredRequests.length });
  } catch (err) {
    console.error("[Admin Inbox Count] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch admin inbox count" },
      { status: 500 }
    );
  }
}

