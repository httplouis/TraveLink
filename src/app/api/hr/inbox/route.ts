import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/hr/inbox
 * Fetch requests awaiting HR approval (status = 'pending_hr')
 * Filters by next_hr_id in workflow_metadata if specified
 */
export async function GET() {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS completely)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        ok: false,
        error: "Missing Supabase configuration"
      }, { status: 500 });
    }

    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get user profile to check HR status and get profile ID
    const { data: profile } = await supabaseServiceRole
      .from("users")
      .select("id, name, email, is_hr")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_hr) {
      return NextResponse.json({ ok: false, error: "Access denied. HR role required." }, { status: 403 });
    }

    // Fetch all pending_hr requests WITHOUT foreign key relationships first to avoid RLS filtering issues
    console.log("[HR Inbox API] Fetching requests with service role client...");
    const { data: allRequests, error} = await supabaseServiceRole
      .from("requests")
      .select("*")
      .eq("status", "pending_hr")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[HR Inbox API] Fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[HR Inbox API] Fetched requests:", {
      count: allRequests?.length || 0,
      hasError: !!error,
      errorMessage: error?.message
    });

    // Now fetch related data separately to avoid RLS filtering issues
    if (allRequests && allRequests.length > 0) {
      const requesterIds = [...new Set(allRequests.map((r: any) => r.requester_id).filter(Boolean))];
      const departmentIds = [...new Set(allRequests.map((r: any) => r.department_id).filter(Boolean))];
      const approverIds = [
        ...new Set([
          ...allRequests.map((r: any) => r.head_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.parent_head_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.admin_processed_by).filter(Boolean),
          ...allRequests.map((r: any) => r.comptroller_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.vp_approved_by).filter(Boolean),
        ])
      ];

      // Fetch all related data in parallel using service role client
      const [requesters, departments, approvers] = await Promise.all([
        requesterIds.length > 0
          ? supabaseServiceRole.from("users").select("id, email, name, department_id").in("id", requesterIds)
          : Promise.resolve({ data: [], error: null }),
        departmentIds.length > 0
          ? supabaseServiceRole.from("departments").select("id, name, code").in("id", departmentIds)
          : Promise.resolve({ data: [], error: null }),
        approverIds.length > 0
          ? supabaseServiceRole.from("users").select("id, email, name, department_id, is_head, is_vp").in("id", approverIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Create lookup maps
      const requesterMap = new Map((requesters.data || []).map((u: any) => [u.id, u]));
      const departmentMap = new Map((departments.data || []).map((d: any) => [d.id, d]));
      const approverMap = new Map((approvers.data || []).map((u: any) => {
        // Attach department info to approver if available
        const approverWithDept = { ...u };
        if (u.department_id && departmentMap.has(u.department_id)) {
          approverWithDept.department = departmentMap.get(u.department_id);
        }
        return [u.id, approverWithDept];
      }));

      // Attach related data to requests
      allRequests.forEach((req: any) => {
        req.requester = req.requester_id ? requesterMap.get(req.requester_id) : null;
        req.department = req.department_id ? departmentMap.get(req.department_id) : null;
        req.head_approver = req.head_approved_by ? approverMap.get(req.head_approved_by) : null;
        req.parent_head_approver = req.parent_head_approved_by ? approverMap.get(req.parent_head_approved_by) : null;
        req.admin_approver = req.admin_processed_by ? approverMap.get(req.admin_processed_by) : null;
        req.comptroller_approver = req.comptroller_approved_by ? approverMap.get(req.comptroller_approved_by) : null;
        req.vp_approver = req.vp_approved_by ? approverMap.get(req.vp_approved_by) : null;
        
        // Attach department info to approvers if they have department_id
        if (req.head_approver?.department_id) {
          req.head_approver.department = departmentMap.get(req.head_approver.department_id);
        }
        if (req.parent_head_approver?.department_id) {
          req.parent_head_approver.department = departmentMap.get(req.parent_head_approver.department_id);
        }
        if (req.vp_approver?.department_id) {
          req.vp_approver.department = departmentMap.get(req.vp_approver.department_id);
        }
      });
    }

    // Filter requests: If request has next_hr_id in workflow_metadata, only show to that specific HR
    // Also check next_approver_id as universal fallback (for "all users" selection)
    const requests = (allRequests || []).filter((req: any) => {
      const workflowMetadata = req.workflow_metadata || {};
      // Handle both object and JSON string formats
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
          console.error(`[HR Inbox] Error parsing workflow_metadata as JSON:`, e);
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextHrId = workflowMetadata?.next_hr_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }

      const nextHrIdStr = nextHrId ? String(nextHrId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = String(profile.id).trim();
      
      // Universal fallback: If next_approver_id matches and role is hr, show it
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "hr";

      // If request is assigned to a specific HR, only show to that HR
      if (nextHrIdStr || isAssignedViaUniversalId) {
        if (nextHrIdStr !== profileIdStr && !isAssignedViaUniversalId) {
          console.log(`[HR Inbox] Skipping request ${req.id} - assigned to different HR (${nextHrIdStr || nextApproverIdStr} vs ${profileIdStr})`);
          return false;
        }
        // This HR is assigned - show it
        return true;
      }

      // No specific HR assigned - show to all HRs (first come first serve)
      return true;
    }).slice(0, 50);

    // Debug logging
    console.log("[HR Inbox API] Total requests:", requests?.length, "out of", allRequests?.length);
    if (requests && requests.length > 0) {
      console.log("[HR Inbox API] First request:", requests[0]);
    }

    return NextResponse.json({ ok: true, data: requests || [] });
  } catch (err) {
    console.error("HR inbox error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch HR inbox" },
      { status: 500 }
    );
  }
}
