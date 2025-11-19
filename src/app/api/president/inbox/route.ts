import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Use service_role to bypass RLS for admin operations
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to check President status and get profile ID
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, is_president")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    if (!profile.is_president) {
      return NextResponse.json(
        { ok: false, error: "Access denied. President role required." },
        { status: 403 }
      );
    }

    // Get requests requiring Presidential approval
    // President reviews:
    // 1. Requests with status = pending_exec where both VPs have approved (both_vps_approved = true)
    // 2. Requests with status = pending_president (legacy)
    // 3. Requests with workflow_metadata.next_president_id matching this President
    const { data: allRequests, error: requestsError } = await supabase
      .from("requests")
      .select(`
        *,
        vp_approver:users!vp_approved_by(id, name, email, position_title),
        vp2_approver:users!vp2_approved_by(id, name, email, position_title)
      `)
      .or(`and(status.eq.pending_exec,both_vps_approved.eq.true),status.eq.pending_president`)
      .is("president_approved_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (requestsError) {
      console.error("President Inbox error:", requestsError);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch President inbox", details: requestsError.message },
        { status: 500 }
      );
    }

    // Filter requests: If request has next_president_id in workflow_metadata, only show to that specific President
    // Also check next_approver_id as universal fallback (for "all users" selection)
    const requests = (allRequests || []).filter((req: any) => {
      const workflowMetadata = req.workflow_metadata || {};
      // Handle both object and JSON string formats
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
          console.error(`[President Inbox] Error parsing workflow_metadata as JSON:`, e);
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextPresidentId = workflowMetadata?.next_president_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }

      const nextPresidentIdStr = nextPresidentId ? String(nextPresidentId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = String(profile.id).trim();
      
      // Universal fallback: If next_approver_id matches and role is president, show it
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "president";

      // If request is assigned to a specific President, only show to that President
      if (nextPresidentIdStr || isAssignedViaUniversalId) {
        if (nextPresidentIdStr !== profileIdStr && !isAssignedViaUniversalId) {
          console.log(`[President Inbox] Skipping request ${req.id} - assigned to different President (${nextPresidentIdStr || nextApproverIdStr} vs ${profileIdStr})`);
          return false;
        }
        // This President is assigned - show it
        return true;
      }

      // No specific President assigned - show to all Presidents (first come first serve)
      return true;
    }).slice(0, 50);

    // Get requester and department info separately for each request
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (req) => {
        const { data: requester } = await supabase
          .from("users")
          .select("name, profile_picture, position_title")
          .eq("id", req.requester_id)
          .single();

        const { data: department } = await supabase
          .from("departments")
          .select("name, code")
          .eq("id", req.department_id)
          .single();

        let vpApprover = null;
        if (req.vp_approved_by) {
          const { data: vp } = await supabase
            .from("users")
            .select("name, signature")
            .eq("id", req.vp_approved_by)
            .single();
          vpApprover = vp;
        }

        return {
          ...req,
          requester_name: requester?.name || "Unknown",
          requester,
          department,
          vp_approver: vpApprover,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: enrichedRequests,
    });
  } catch (error) {
    console.error("President Inbox error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch President inbox" },
      { status: 500 }
    );
  }
}
