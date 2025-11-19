import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    console.log("[VP Inbox] Fetching VP inbox...");

    // Get authenticated user first (for authorization)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[VP Inbox] Auth error:", authError);
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[VP Inbox] User authenticated:", user.email);

    // Use direct createClient for service role to truly bypass RLS for queries
    // createServerClient with cookies might still apply RLS
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

    // Get user profile to check VP status and get profile ID for filtering
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, is_vp, exec_type, role")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error("[VP Inbox] Profile error:", profileError);
      return NextResponse.json(
        { ok: false, error: "Profile not found", details: profileError.message },
        { status: 404 }
      );
    }

    if (!profile?.is_vp) {
      console.error("[VP Inbox] Access denied - not VP");
      return NextResponse.json(
        { ok: false, error: "Access denied. VP role required." },
        { status: 403 }
      );
    }

    console.log(`[VP Inbox] 🔍 VP verified: ${profile.name} (ID: ${profile.id}, Email: ${user.email})`);
    console.log(`[VP Inbox] VP details: is_vp=${profile.is_vp}, exec_type=${profile.exec_type}, role=${profile.role}`);

    // Get requests requiring VP approval
    // VP reviews requests with:
    // 1. status = pending_exec (executive approval needed) - standard workflow
    // 2. status = pending_head with workflow_metadata.next_vp_id matching this VP - head selected VP during submission
    // Show requests where:
    // 1. No VP has approved yet (vp_approved_by is null)
    // 2. OR first VP has approved but second VP hasn't (vp_approved_by is not null, vp2_approved_by is null, and current VP is not the first VP)
    // IMPORTANT: Exclude requests where parent head (who is a VP) already signed - these should go directly to President
    
    // Fetch both pending_exec AND pending_head requests (head may have selected VP during submission)
    // Use .in() instead of .or() for better compatibility
    console.log(`[VP Inbox] 🔍 Querying requests with status IN ('pending_exec', 'pending_head')...`);
    
    const { data: allRequests, error: requestsError } = await supabase
      .from("requests")
      .select(`
        *,
        vp_approver:users!vp_approved_by(id, name, email, position_title),
        vp2_approver:users!vp2_approved_by(id, name, email, position_title),
        parent_head_approver:users!parent_head_approved_by(id, is_vp, exec_type, role)
      `)
      .in("status", ["pending_exec", "pending_head"])
      .order("created_at", { ascending: false })
      .limit(100);
    
    console.log(`[VP Inbox] 🔍 Query executed. Result:`, {
      count: allRequests?.length || 0,
      hasError: !!requestsError,
      error: requestsError ? {
        message: requestsError.message,
        code: requestsError.code,
        details: requestsError.details
      } : null
    });

    if (requestsError) {
      console.error("[VP Inbox] Request fetch error:", requestsError);
      console.error("[VP Inbox] Error details:", {
        message: requestsError.message,
        code: requestsError.code,
        details: requestsError.details,
        hint: requestsError.hint
      });
      return NextResponse.json(
        { ok: false, error: "Failed to fetch VP inbox", details: requestsError.message },
        { status: 500 }
      );
    }

    console.log(`[VP Inbox] 📥 Fetched ${allRequests?.length || 0} total requests (pending_exec + pending_head)`);
    
    // Debug: Log first few requests to see what we got
    if (allRequests && allRequests.length > 0) {
      console.log(`[VP Inbox] 🔍 Sample requests:`, allRequests.slice(0, 3).map((r: any) => ({
        id: r.id,
        request_number: r.request_number,
        status: r.status,
        workflow_metadata: r.workflow_metadata,
        next_vp_id: r.workflow_metadata?.next_vp_id
      })));
    } else {
      console.log(`[VP Inbox] ⚠️ No requests found - trying alternative query...`);
      
      // Try a simpler query without joins to see if that's the issue
      const { data: simpleRequests, error: simpleError } = await supabase
        .from("requests")
        .select("id, request_number, status, workflow_metadata")
        .in("status", ["pending_exec", "pending_head"])
        .limit(5);
      
      console.log(`[VP Inbox] 🔍 Simple query result:`, {
        count: simpleRequests?.length || 0,
        error: simpleError,
        sample: simpleRequests?.slice(0, 2)
      });
    }

    // Filter requests: 
    // 1. Exclude if parent head (who is a VP) already signed - these should go to President, not VP
    // 2. Show if no VP approved OR if first VP approved but second hasn't (and current VP is not the first)
    // 3. If request has next_vp_id in workflow_metadata, only show to that specific VP
    const requests = (allRequests || []).filter((req: any) => {
      // Skip if parent head VP already signed (should go to President, not VP)
      const parentHeadSigned = !!(req.parent_head_approved_at || req.parent_head_signature);
      const parentHeadApprover = req.parent_head_approver as any;
      const parentHeadIsVP = parentHeadApprover?.is_vp === true || 
                             parentHeadApprover?.exec_type === 'vp' || 
                             parentHeadApprover?.role === 'exec';
      
      if (parentHeadSigned && parentHeadIsVP) {
        console.log(`[VP Inbox] Skipping request ${req.id} - parent head VP already signed`);
        return false; // Skip this request - should go to President, not VP
      }
      
      // Check if request is specifically assigned to a VP via workflow_metadata
      const workflowMetadata = req.workflow_metadata || {};
      // Handle both object and JSON string formats
      let nextVpId = null;
      let nextApproverId = null;
      let nextApproverRole = null;
      if (typeof workflowMetadata === 'string') {
        try {
          const parsed = JSON.parse(workflowMetadata);
          nextVpId = parsed?.next_vp_id;
          nextApproverId = parsed?.next_approver_id;
          nextApproverRole = parsed?.next_approver_role;
        } catch (e) {
          console.error(`[VP Inbox] Error parsing workflow_metadata as JSON:`, e);
        }
      } else if (workflowMetadata && typeof workflowMetadata === 'object') {
        nextVpId = workflowMetadata?.next_vp_id;
        nextApproverId = workflowMetadata?.next_approver_id;
        nextApproverRole = workflowMetadata?.next_approver_role;
      }
      
      // Convert both to strings for reliable comparison (UUIDs)
      const nextVpIdStr = nextVpId ? String(nextVpId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = profile.id ? String(profile.id).trim() : null;
      
      // Universal fallback: If next_approver_id matches and role is vp, show it
      // This handles cases where a user from "all users" was selected
      const isAssignedViaUniversalId = nextApproverIdStr === profileIdStr && nextApproverRole === "vp";
      
      console.log(`[VP Inbox] Checking request ${req.id} (${req.request_number}):`, {
        status: req.status,
        workflow_metadata: workflowMetadata,
        next_vp_id: nextVpIdStr,
        current_vp_id: profileIdStr,
        match: nextVpIdStr === profileIdStr,
        next_vp_id_raw: nextVpId,
        profile_id_raw: profile.id
      });
      
      // If request is pending_head with next_vp_id or next_approver_id (universal), only show to assigned VP
      if (req.status === 'pending_head' && (nextVpIdStr || isAssignedViaUniversalId)) {
        console.log(`[VP Inbox] 🔍 Checking pending_head request ${req.id} (${req.request_number}):`, {
          next_vp_id: nextVpIdStr,
          next_approver_id: nextApproverIdStr,
          profile_id: profileIdStr,
          match: (nextVpIdStr === profileIdStr) || isAssignedViaUniversalId,
          next_vp_id_type: typeof nextVpId,
          profile_id_type: typeof profile.id
        });
        
        if (nextVpIdStr !== profileIdStr && !isAssignedViaUniversalId) {
          console.log(`[VP Inbox] ❌ Skipping request ${req.id} - pending_head assigned to different VP (${nextVpIdStr || nextApproverIdStr} vs ${profileIdStr})`);
          return false;
        }
        // This VP is assigned - show it even though it's still pending_head
        console.log(`[VP Inbox] ✅ Request ${req.id} (${req.request_number}) (pending_head) assigned to this VP - SHOWING`);
        return true;
      }
      
      // For pending_exec requests
      if (req.status === 'pending_exec') {
        if (nextVpIdStr || isAssignedViaUniversalId) {
          // Request is assigned to a specific VP - only show to that VP
          if (nextVpIdStr !== profileIdStr && !isAssignedViaUniversalId) {
            console.log(`[VP Inbox] ❌ Skipping request ${req.id} - assigned to different VP (${nextVpIdStr || nextApproverIdStr} vs ${profileIdStr})`);
            return false;
          }
          // This VP is the assigned one - show it (even if no VP approved yet)
          console.log(`[VP Inbox] ✅ Request ${req.id} (${req.request_number}) assigned to this VP - showing`);
          return true;
        }
        
        // No specific VP assigned - show to all VPs (first come first serve)
        const noVPApproved = !req.vp_approved_by;
        const firstVPApproved = req.vp_approved_by && !req.vp2_approved_by && req.vp_approved_by !== profile.id;
        return noVPApproved || firstVPApproved;
      }
      
      // For other statuses, don't show
      return false;
    }).slice(0, 50);

    console.log(`[VP Inbox] Found ${requests?.length || 0} requests after filtering`);
    console.log(`[VP Inbox] Total pending_exec/pending_head requests before filtering: ${allRequests?.length || 0}`);
    
    // Debug: Log all requests and why they were filtered
    if (allRequests && allRequests.length > 0) {
      console.log(`[VP Inbox] Debug - All pending_exec/pending_head requests:`, allRequests.map((r: any) => ({
        id: r.id,
        request_number: r.request_number,
        workflow_metadata: r.workflow_metadata,
        next_vp_id: r.workflow_metadata?.next_vp_id,
        vp_approved_by: r.vp_approved_by,
        vp2_approved_by: r.vp2_approved_by,
        parent_head_approved_by: r.parent_head_approved_by,
        parent_head_approved_at: r.parent_head_approved_at,
        should_show: requests?.some((filtered: any) => filtered.id === r.id)
      })));
    }

    // If no requests, return empty array
    if (!requests || requests.length === 0) {
      console.log(`[VP Inbox] No requests found for VP ${profile.id} (${user.email})`);
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Get requester and department info separately for each request
    // Also get routing information (who sent it, from where)
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        try {
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

          // Get routing information: who sent this to VP?
          let sentBy = null;
          let routedFrom = null;
          let routingDetails = null;

          // Check workflow_metadata for routing info
          const workflowMetadata = req.workflow_metadata || {};
          const nextVpId = workflowMetadata?.next_vp_id;

          // Determine who sent it based on approval chain
          if (req.parent_head_approved_at && req.parent_head_approved_by) {
            // Sent by parent head (VP)
            const { data: parentHead } = await supabase
              .from("users")
              .select("name, position_title, exec_type")
              .eq("id", req.parent_head_approved_by)
              .single();
            
            sentBy = parentHead?.name || "Parent Head";
            routedFrom = "Parent Department Head";
            routingDetails = {
              type: "parent_head",
              name: parentHead?.name,
              position: parentHead?.position_title || "Parent Department Head",
              exec_type: parentHead?.exec_type
            };
          } else if (req.head_approved_at && req.head_approved_by) {
            // Sent by department head
            const { data: head } = await supabase
              .from("users")
              .select("name, position_title")
              .eq("id", req.head_approved_by)
              .single();
            
            sentBy = head?.name || "Department Head";
            routedFrom = "Department Head";
            routingDetails = {
              type: "head",
              name: head?.name,
              position: head?.position_title || "Department Head"
            };
          } else if (req.hr_approved_at && req.hr_approved_by) {
            // Sent by HR
            const { data: hr } = await supabase
              .from("users")
              .select("name, position_title")
              .eq("id", req.hr_approved_by)
              .single();
            
            sentBy = hr?.name || "HR Manager";
            routedFrom = "Human Resources";
            routingDetails = {
              type: "hr",
              name: hr?.name,
              position: hr?.position_title || "HR Manager"
            };
          } else if (req.admin_processed_at && req.admin_processed_by) {
            // Sent by Admin
            const { data: admin } = await supabase
              .from("users")
              .select("name, position_title")
              .eq("id", req.admin_processed_by)
              .single();
            
            sentBy = admin?.name || "Administrator";
            routedFrom = "Administrator";
            routingDetails = {
              type: "admin",
              name: admin?.name,
              position: admin?.position_title || "Administrator"
            };
          }

          // If assigned to specific VP, get that VP's info
          let assignedToVP = null;
          if (nextVpId) {
            const { data: assignedVP } = await supabase
              .from("users")
              .select("name, position_title, exec_type")
              .eq("id", nextVpId)
              .single();
            
            assignedToVP = assignedVP ? {
              id: nextVpId,
              name: assignedVP.name,
              position: assignedVP.position_title,
              exec_type: assignedVP.exec_type
            } : null;
          }

          return {
            ...req,
            requester_name: requester?.name || "Unknown",
            requester,
            department,
            // Routing information
            sent_by: sentBy,
            routed_from: routedFrom,
            routing_details: routingDetails,
            assigned_to_vp: assignedToVP,
            workflow_metadata: workflowMetadata
          };
        } catch (enrichError) {
          console.error("[VP Inbox] Enrichment error for request:", req.id, enrichError);
          return {
            ...req,
            requester_name: "Unknown",
            requester: null,
            department: null,
            sent_by: null,
            routed_from: null,
            routing_details: null,
            assigned_to_vp: null
          };
        }
      })
    );

    console.log("[VP Inbox] Requests enriched, returning data");

    return NextResponse.json({
      ok: true,
      data: enrichedRequests,
    });
  } catch (error: any) {
    console.error("[VP Inbox] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch VP inbox", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
