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

    // First authenticate with user session (anon key + cookies)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Then use service role for database operations
    const supabase = await createSupabaseServerClient(true);
    
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
    
    // Check if TO-2025-155 is in the raw fetch
    const to155InRaw = allRequests?.find((r: any) => r.request_number === 'TO-2025-155');
    if (to155InRaw) {
      console.log(`[Admin Inbox API] 🔍 Found TO-2025-155 in raw fetch:`, {
        id: to155InRaw.id,
        status: to155InRaw.status,
        requester_is_head: to155InRaw.requester_is_head,
        workflow_metadata: to155InRaw.workflow_metadata,
        workflow_metadata_type: typeof to155InRaw.workflow_metadata
      });
    } else {
      console.log(`[Admin Inbox API] ❌ TO-2025-155 NOT FOUND in raw fetch!`);
    }

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
          ? supabaseServiceRole.from("users").select("id, email, name, role, is_comptroller, is_head").in("id", requesterIds)
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

    // Filter requests: Admin should ONLY see requests that have been approved by heads
    // Exclude drafts (not submitted yet) and pending_head (still waiting for head approval)
    const requests = (allRequests || []).filter((req: any) => {
      // Exclude drafts - these are not submitted yet
      if (req.status === 'draft') {
        return false;
      }
      
      // Parse workflow_metadata if it's a string (JSONB from database)
      let workflowMetadata: any = {};
      if (req.workflow_metadata) {
        if (typeof req.workflow_metadata === 'string') {
          try {
            workflowMetadata = JSON.parse(req.workflow_metadata);
          } catch (e) {
            console.warn(`[Admin Inbox API] Failed to parse workflow_metadata for ${req.request_number || req.id}:`, e);
            workflowMetadata = {};
          }
        } else {
          workflowMetadata = req.workflow_metadata;
        }
      }
      
      // Check if head has already approved FIRST (before excluding pending_head)
      // This handles multi-department requests where status might still be pending_head
      // but one or more heads have already approved
      const headApproved = !!(req.head_approved_at || req.head_signature || req.parent_head_approved_at || req.parent_head_signature);
      
      // Also check if head sent this to admin (via workflow_metadata)
      // OR if requester is head and status is pending_head/pending_admin (head requester can send directly to admin)
      const sentToAdmin = workflowMetadata.next_approver_role === 'admin' || workflowMetadata.next_admin_id;
      const isHeadRequester = req.requester_is_head === true;
      
      // SPECIAL CASE: Head requester with next_approver_role = 'admin' should be visible to admin
      // This handles cases where head submits and selects admin during submission
      // Even if head hasn't "approved" yet (because they're the requester), they've selected admin
      const headRequesterSentToAdmin = isHeadRequester && sentToAdmin && (req.status === 'pending_head' || req.status === 'pending_admin');
      
      // Debug logging for TO-2025-155 specifically
      if (req.request_number === 'TO-2025-155') {
        console.log(`[Admin Inbox API] 🔍 DEBUG TO-2025-155:`, {
          status: req.status,
          requester_is_head: req.requester_is_head,
          headApproved,
          workflowMetadata,
          sentToAdmin,
          isHeadRequester,
          headRequesterSentToAdmin,
          shouldInclude: headApproved || sentToAdmin || headRequesterSentToAdmin
        });
      }
      
      // If head has approved, include it even if status is still pending_head
      // (this happens in multi-department requests where not all heads have approved yet)
      // OR if head explicitly sent it to admin
      // OR if head requester sent it to admin (special case)
      if (headApproved || sentToAdmin || headRequesterSentToAdmin) {
        if (req.status === 'pending_head' && (headApproved || sentToAdmin || headRequesterSentToAdmin)) {
          console.log(`[Admin Inbox API] ✅ Including pending_head request ${req.request_number || req.id} - head approved: ${headApproved}, sentToAdmin: ${sentToAdmin}, headRequesterSentToAdmin: ${headRequesterSentToAdmin}`);
        }
        return true;
      }
      
      // Exclude pending_head - these are still waiting for head approval
      // Only exclude if head hasn't approved yet AND hasn't sent to admin AND not head requester
      if (req.status === 'pending_head') {
        if (req.request_number === 'TO-2025-155') {
          console.log(`[Admin Inbox API] ❌ EXCLUDING TO-2025-155 - headApproved: ${headApproved}, sentToAdmin: ${sentToAdmin}, headRequesterSentToAdmin: ${headRequesterSentToAdmin}`);
        }
        return false;
      }
      
      // Include requests that are explicitly waiting for admin
      if (req.status === 'pending_admin') {
        return true;
      }
      
      // Include all other statuses (pending_comptroller, pending_hr, pending_exec, approved, etc.)
      // Admin should see the full workflow after head approval
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
    
    // Log requests with head approval but still pending_head status (multi-department case)
    const multiDeptRequests = (allRequests || []).filter((r: any) => {
      const headApproved = !!(r.head_approved_at || r.head_signature || r.parent_head_approved_at || r.parent_head_signature);
      return headApproved && r.status === 'pending_head';
    });
    if (multiDeptRequests.length > 0) {
      console.log("[Admin Inbox API] ⚠️ Found", multiDeptRequests.length, "multi-department requests (head approved but status still pending_head):", 
        multiDeptRequests.map((r: any) => ({
          id: r.id,
          request_number: r.request_number,
          status: r.status,
          head_approved_at: r.head_approved_at,
          head_approved_by: r.head_approved_by
        }))
      );
    }
    
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

    // Auto-create notifications for pending_admin requests that don't have notifications yet
    // This ensures admins get notified even for existing requests
    try {
      const { createNotification } = await import("@/lib/notifications/helpers");
      
      // Get all pending_admin requests that need notifications
      const pendingAdminRequests = requests.filter((req: any) => 
        req.status === 'pending_admin' && 
        (req.head_approved_at || req.head_signature || req.parent_head_approved_at || req.parent_head_signature)
      );
      
      if (pendingAdminRequests.length > 0) {
        console.log("[Admin Inbox API] 📧 Checking notifications for", pendingAdminRequests.length, "pending_admin requests");
        
        // Get all admin user IDs
        const { data: allAdmins } = await supabaseServiceRole
          .from("users")
          .select("id")
          .eq("role", "admin")
          .eq("is_admin", true)
          .eq("status", "active");
        
        if (allAdmins && allAdmins.length > 0) {
          // For each pending_admin request, check if notifications exist
          for (const req of pendingAdminRequests) {
            // Check existing notifications for this request
            const { data: existingNotifications } = await supabaseServiceRole
              .from("notifications")
              .select("user_id")
              .eq("related_type", "request")
              .eq("related_id", req.id)
              .eq("notification_type", "request_pending_signature");
            
            const notifiedAdminIds = new Set(
              (existingNotifications || []).map((n: any) => n.user_id)
            );
            
            // Get requester name
            const requestingPersonName = req.requester_name || req.requester?.name || req.requester?.email || "Requester";
            
            // Create notifications for admins that don't have one yet
            const notificationsToCreate = allAdmins
              .filter((admin: any) => !notifiedAdminIds.has(admin.id))
              .map((admin: any) =>
                createNotification({
                  user_id: admin.id,
                  notification_type: "request_pending_signature",
                  title: "New Request Requires Review",
                  message: `A travel order request ${req.request_number || ''} from ${requestingPersonName} requires your review.`,
                  related_type: "request",
                  related_id: req.id,
                  action_url: `/admin/requests?view=${req.id}`,
                  action_label: "Review Request",
                  priority: "high",
                })
              );
            
            if (notificationsToCreate.length > 0) {
              const results = await Promise.allSettled(notificationsToCreate);
              const successful = results.filter((r) => r.status === "fulfilled" && r.value).length;
              console.log(`[Admin Inbox API] ✅ Created ${successful} notification(s) for request ${req.request_number || req.id}`);
            }
          }
        }
      }
    } catch (notifError: any) {
      console.error("[Admin Inbox API] ⚠️ Failed to create notifications (non-fatal):", notifError);
      // Don't fail the request if notifications fail
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

