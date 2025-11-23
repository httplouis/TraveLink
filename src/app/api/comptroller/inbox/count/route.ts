import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/comptroller/inbox/count
 * Lightweight endpoint to get the count of pending requests for Comptroller
 * Includes workflow_metadata filtering for specific comptroller assignments
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
      .select("id, is_comptroller")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_comptroller) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // Fetch all pending comptroller requests
    const { data: allRequests, error } = await supabase
      .from("requests")
      .select("id, status, workflow_metadata")
      .eq("status", "pending_comptroller")
      .limit(100);

    if (error) {
      console.error("[Comptroller Inbox Count] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Filter by workflow_metadata if specific comptroller is assigned
    const filteredRequests = (allRequests || []).filter((req: any) => {
      const workflowMetadata = req.workflow_metadata || {};
      let nextComptrollerId = null;
      let nextApproverId = null;
      let nextApproverRole = null;
      
      if (typeof workflowMetadata === 'string') {
        try {
          const parsed = JSON.parse(workflowMetadata);
          nextComptrollerId = parsed?.next_comptroller_id;
          nextApproverId = parsed?.next_approver_id;
          nextApproverRole = parsed?.next_approver_role;
        } catch (e) {
          // Ignore parse errors
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextComptrollerId = workflowMetadata?.next_comptroller_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }

      const nextComptrollerIdStr = nextComptrollerId ? String(nextComptrollerId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = String(profile.id).trim();
      
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "comptroller";

      if (nextComptrollerIdStr || isAssignedViaUniversalId) {
        return (nextComptrollerIdStr === profileIdStr) || isAssignedViaUniversalId;
      }

      return true; // No specific assignment - show to all comptrollers
    });

    return NextResponse.json({ ok: true, count: filteredRequests.length });
  } catch (err) {
    console.error("[Comptroller Inbox Count] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch comptroller inbox count" },
      { status: 500 }
    );
  }
}
