import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/inbox
 * Fetch requests for admin view
 * If next_admin_id is set in workflow_metadata, only show to that specific admin
 * Otherwise, show all requests (admin can see everything)
 */
export async function GET() {
  try {
    // Create a direct Supabase client with service role key to bypass RLS
    // This ensures we can fetch ALL requests regardless of RLS policies
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

    const supabase = await createSupabaseServerClient(true); // Use service role for auth checks
    
    // Get authenticated user to check admin status and get profile ID for filtering
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check admin status and get profile ID
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ ok: false, error: "Access denied. Admin role required." }, { status: 403 });
    }

    // First, get all requests without foreign key relationships to avoid filtering issues
    // Use service role client directly to bypass RLS policies
    console.log("[Admin Inbox API] Fetching all requests with service role client...");
    const { data: allRequests, error } = await supabaseServiceRole
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000); // Increased limit to ensure all requests are fetched

    if (error) {
      console.error("[Admin Inbox API] Fetch error:", error);
      console.error("[Admin Inbox API] Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[Admin Inbox API] Raw fetch result:", {
      count: allRequests?.length || 0,
      hasData: !!allRequests,
      isArray: Array.isArray(allRequests),
      firstRequestId: allRequests?.[0]?.id || null
    });

    // Now fetch related data separately to avoid filtering issues
    if (allRequests && allRequests.length > 0) {
      const requesterIds = [...new Set(allRequests.map((r: any) => r.requester_id).filter(Boolean))];
      const departmentIds = [...new Set(allRequests.map((r: any) => r.department_id).filter(Boolean))];
      const approverIds = [
        ...new Set([
          ...allRequests.map((r: any) => r.head_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.parent_head_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.admin_processed_by).filter(Boolean),
          ...allRequests.map((r: any) => r.comptroller_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.hr_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.vp_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.vp2_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.president_approved_by).filter(Boolean),
          ...allRequests.map((r: any) => r.exec_approved_by).filter(Boolean),
        ])
      ];

      // Fetch all related data in parallel using service role client
      const [requesters, departments, approvers] = await Promise.all([
        requesterIds.length > 0
          ? supabaseServiceRole.from("users").select("id, email, name").in("id", requesterIds)
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
        req.hr_approver = req.hr_approved_by ? approverMap.get(req.hr_approved_by) : null;
        req.vp_approver = req.vp_approved_by ? approverMap.get(req.vp_approved_by) : null;
        req.vp2_approver = req.vp2_approved_by ? approverMap.get(req.vp2_approved_by) : null;
        req.president_approver = req.president_approved_by ? approverMap.get(req.president_approved_by) : null;
        req.exec_approver = req.exec_approved_by ? approverMap.get(req.exec_approved_by) : null;
        
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
        if (req.vp2_approver?.department_id) {
          req.vp2_approver.department = departmentMap.get(req.vp2_approver.department_id);
        }
        if (req.president_approver?.department_id) {
          req.president_approver.department = departmentMap.get(req.president_approver.department_id);
        }
      });
    }

    // Filter requests: Show ALL requests to admin
    // Admin can see everything - no filtering needed
    // The frontend will handle displaying pending vs history
    const requests = (allRequests || []).filter((req: any) => {
      // Always show all requests to admin - they can see everything
      // The frontend will filter by status (pending vs history)
      return true;
    });

    // Debug logging
    console.log("[Admin Inbox API] Total requests:", requests?.length, "out of", allRequests?.length);
    console.log("[Admin Inbox API] Profile ID:", profile.id);
    console.log("[Admin Inbox API] Profile email:", profile.email);
    
    // Count requests by status
    const statusCounts: Record<string, number> = {};
    (allRequests || []).forEach((r: any) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    console.log("[Admin Inbox API] Status breakdown:", statusCounts);
    
    // Count filtered requests by status
    const filteredStatusCounts: Record<string, number> = {};
    (requests || []).forEach((r: any) => {
      filteredStatusCounts[r.status] = (filteredStatusCounts[r.status] || 0) + 1;
    });
    console.log("[Admin Inbox API] Filtered status breakdown:", filteredStatusCounts);
    
    console.log("[Admin Inbox API] All request IDs:", allRequests?.map((r: any) => ({
      id: r.id,
      request_number: r.request_number,
      status: r.status,
      workflow_metadata: r.workflow_metadata
    })));
    console.log("[Admin Inbox API] Filtered request IDs:", requests?.map((r: any) => ({
      id: r.id,
      request_number: r.request_number,
      status: r.status,
      workflow_metadata: r.workflow_metadata
    })));
    if (requests && requests.length > 0) {
      console.log("[Admin Inbox API] First request:", requests[0]);
      console.log("[Admin Inbox API] First request department:", requests[0].department);
      console.log("[Admin Inbox API] First request department_id:", requests[0].department_id);
      console.log("[Admin Inbox API] First request requester:", requests[0].requester);
    } else {
      console.warn("[Admin Inbox API] ⚠️ No requests returned after filtering!");
      console.log("[Admin Inbox API] Sample of all requests:", allRequests?.slice(0, 3).map((r: any) => ({
        id: r.id,
        request_number: r.request_number,
        status: r.status,
        workflow_metadata: r.workflow_metadata,
        next_approver_role: typeof r.workflow_metadata === 'object' ? r.workflow_metadata?.next_approver_role : null,
        next_approver_id: typeof r.workflow_metadata === 'object' ? r.workflow_metadata?.next_approver_id : null
      })));
    }

    // Return data in the format expected by useRequestsFromSupabase
    // The hook expects an array directly, but we're returning { ok: true, data: [...] }
    // So we need to check if the response has 'data' property
    const responseData = requests || [];
    
    console.log("[Admin Inbox API] Returning", responseData.length, "requests");
    if (responseData.length > 0) {
      console.log("[Admin Inbox API] Sample request:", {
        id: responseData[0].id,
        request_number: responseData[0].request_number,
        status: responseData[0].status,
        workflow_metadata: responseData[0].workflow_metadata
      });
    }
    
    return NextResponse.json({ ok: true, data: responseData });
  } catch (err) {
    console.error("Admin inbox error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch admin inbox" },
      { status: 500 }
    );
  }
}

