import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user first (for authorization)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
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
    // 3. Requests with status = pending_exec (VP routed directly to President, even if only one VP approved)
    // Use .in() for better compatibility and clarity
    const { data: allRequests, error: requestsError } = await supabase
      .from("requests")
      .select(`
        *,
        vp_approver:users!vp_approved_by(id, name, email, position_title),
        vp2_approver:users!vp2_approved_by(id, name, email, position_title)
      `)
      .in("status", ["pending_exec", "pending_president"])
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

    // Filter requests: 
    // 1. If request has next_president_id in workflow_metadata, only show to that specific President
    // 2. Also check next_approver_id as universal fallback (for "all users" selection)
    // 3. Only show requests where next_approver_role is "president" OR both_vps_approved is true OR status is pending_president
    const requests = (allRequests || []).filter((req: any) => {
      // Parse workflow_metadata
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
          console.error(`[President Inbox] Error parsing workflow_metadata as JSON:`, e);
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextPresidentId = workflowMetadata?.next_president_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }

      // Check if this request should go to President
      // Skip if next_approver_role is explicitly set to something other than "president" (e.g., "hr", "admin", "comptroller")
      if (nextApproverRole && nextApproverRole !== "president") {
        console.log(`[President Inbox] Skipping request ${req.id} - next_approver_role is "${nextApproverRole}", not "president"`);
        return false;
      }

      // For pending_exec status, only show if:
      // - both_vps_approved is true, OR
      // - next_approver_role is "president", OR
      // - next_president_id is set, OR
      // - status is pending_president (legacy)
      if (req.status === "pending_exec") {
        const shouldShow = 
          req.both_vps_approved === true ||
          nextApproverRole === "president" ||
          nextPresidentId !== null;
        
        if (!shouldShow) {
          console.log(`[President Inbox] Skipping request ${req.id} - pending_exec but not ready for President (both_vps_approved=${req.both_vps_approved}, next_approver_role=${nextApproverRole}, next_president_id=${nextPresidentId})`);
          return false;
        }
      }

      // Check if assigned to specific President
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
