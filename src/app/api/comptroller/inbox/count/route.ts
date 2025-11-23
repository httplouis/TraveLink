import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/comptroller/inbox/count
 * Lightweight endpoint to get the count of pending requests for Comptroller
 * Includes workflow_metadata filtering for specific comptroller assignments
 * Also shows to Financial Analysts in the same department when a Comptroller is assigned
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(false); // Use authenticated client for auth
    
    // Get current user profile for filtering
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries
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

    const { data: profile } = await supabaseServiceRole
      .from("users")
      .select("id, is_comptroller, department_id, position_title")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_comptroller) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // Fetch all pending comptroller requests
    const { data: allRequests, error } = await supabaseServiceRole
      .from("requests")
      .select("id, status, workflow_metadata")
      .eq("status", "pending_comptroller")
      .limit(100);

    if (error) {
      console.error("[Comptroller Inbox Count] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const profileIdStr = String(profile.id).trim();
    const currentUserDeptId = profile.department_id;
    const isFinancialAnalyst = profile.position_title?.toLowerCase().includes("financial analyst");

    // Filter by workflow_metadata if specific comptroller is assigned
    // Also include Financial Analysts in the same department
    const filteredPromises = (allRequests || []).map(async (req: any) => {
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
      
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "comptroller";

      // If assigned to specific comptroller
      if (nextComptrollerIdStr || isAssignedViaUniversalId) {
        // Show to the assigned comptroller
        if (nextComptrollerIdStr === profileIdStr || isAssignedViaUniversalId) {
          return true;
        }
        
        // Also show to Financial Analysts in the same department as the assigned comptroller
        if (currentUserDeptId && isFinancialAnalyst) {
          const assignedId = nextComptrollerIdStr || nextApproverIdStr;
          if (assignedId) {
            const { data: assignedComptroller } = await supabaseServiceRole
              .from("users")
              .select("department_id")
              .eq("id", assignedId)
              .single();
            
            if (assignedComptroller?.department_id === currentUserDeptId) {
              return true;
            }
          }
        }
        
        return false;
      }

      return true; // No specific assignment - show to all comptrollers
    });

    const filterResults = await Promise.all(filteredPromises);
    const filteredRequests = (allRequests || []).filter((_, index) => filterResults[index]);

    return NextResponse.json({ ok: true, count: filteredRequests.length });
  } catch (err) {
    console.error("[Comptroller Inbox Count] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch comptroller inbox count" },
      { status: 500 }
    );
  }
}
