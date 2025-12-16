import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// Force dynamic rendering (uses request.url - must be dynamic)
export const dynamic = 'force-dynamic';
// Note: Use Cache-Control headers for runtime caching (revalidate doesn't work with force-dynamic)

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    
    // Get filter params
    const status = searchParams.get("status");
    const role = searchParams.get("role"); // Filter by current approver role
    const departmentId = searchParams.get("department_id");
    const userId = searchParams.get("user_id"); // Get user's own requests
    const comptrollerId = searchParams.get("comptroller_id"); // For filtering by next_comptroller_id
    const comptrollerApproved = searchParams.get("comptroller_approved"); // Filter by comptroller approval
    const headApproved = searchParams.get("head_approved"); // Filter by head approval
    const hrApproved = searchParams.get("hr_approved"); // Filter by HR approval
    const vpApproved = searchParams.get("vp_approved"); // Filter by VP approval
    const presidentApproved = searchParams.get("president_approved"); // Filter by president approval
    const execApproved = searchParams.get("exec_approved"); // Filter by exec approval
    
    // Fetch requests WITHOUT foreign key relationships first to avoid RLS filtering issues
    // Use service role client directly to bypass RLS
    // OPTIMIZED: Use specific columns and add limit to minimize egress
    console.log("[API /requests/list] Fetching requests with service role client...");
    let query = supabaseServiceRole
      .from("requests")
      .select(`
        id,
        request_number,
        file_code,
        status,
        requester_id,
        requester_name,
        department_id,
        travel_start_date,
        travel_end_date,
        destination,
        purpose,
        created_at,
        updated_at,
        current_approver_role,
        workflow_metadata,
        total_budget,
        comptroller_edited_budget,
        expense_breakdown,
        request_type,
        admin_processed_at,
        comptroller_approved_at,
        head_approved_at,
        hr_approved_at,
        vp_approved_at,
        president_approved_at,
        exec_approved_at
      `)
      .order("created_at", { ascending: false })
      .limit(100); // Reduced to 100 to reduce IO on Nano instance

    // Apply filters
    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    if (role) {
      query = query.eq("current_approver_role", role);
    }

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    if (userId) {
      query = query.eq("requester_id", userId);
    }

    // Filter by comptroller approval (for approved/history tabs)
    if (comptrollerApproved === "true") {
      query = query.not("comptroller_approved_at", "is", null);
    }

    // Filter by head approval
    if (headApproved === "true") {
      query = query.not("head_approved_at", "is", null);
    }

    // Filter by HR approval
    if (hrApproved === "true") {
      query = query.not("hr_approved_at", "is", null);
    }

    // Filter by VP approval
    if (vpApproved === "true") {
      query = query.not("vp_approved_at", "is", null);
    }

    // Filter by president approval
    if (presidentApproved === "true") {
      query = query.not("president_approved_at", "is", null);
    }

    // Filter by exec approval
    if (execApproved === "true") {
      query = query.not("exec_approved_at", "is", null);
    }

    const { data: allRequests, error } = await query;
    
    console.log("[API /requests/list] Fetched requests:", {
      count: allRequests?.length || 0,
      status,
      hasError: !!error,
      errorMessage: error?.message
    });
    
    // If status is pending_comptroller, show ALL requests to ALL comptrollers
    // Only filter by specific comptroller if explicitly assigned (rare case)
    let data = allRequests;
    if (status === "pending_comptroller" && allRequests) {
      console.log("[API /requests/list] Filtering pending_comptroller requests:", {
        totalRequests: allRequests.length,
        comptrollerId: comptrollerId || "none (showing all)"
      });
      
      // IMPORTANT: Show ALL pending_comptroller requests to ALL comptrollers
      // Only filter if a specific comptroller is assigned (which should be rare)
      if (comptrollerId) {
        data = allRequests.filter((req: any) => {
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
          const comptrollerIdStr = String(comptrollerId).trim();
          
          // If request is explicitly assigned to a specific comptroller, only show to that comptroller
          if (nextComptrollerIdStr) {
            return nextComptrollerIdStr === comptrollerIdStr;
          }
          
          // If next_approver_id is set and role is comptroller, check if it matches
          if (nextApproverIdStr && nextApproverRole === "comptroller") {
            return nextApproverIdStr === comptrollerIdStr;
          }

          // No specific assignment - show to ALL comptrollers (default behavior)
          return true;
        });
      }
      // If no comptrollerId provided, show all pending_comptroller requests (data = allRequests)
      
      console.log("[API /requests/list] Filtered pending_comptroller requests:", {
        filteredCount: data?.length || 0,
        totalCount: allRequests?.length || 0
      });
    }

    if (error) {
      console.error("[/api/requests/list] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log sample data for debugging
    if (data && data.length > 0) {
      const firstReq = data[0] as any;
      console.log("[/api/requests/list] Sample request data:", 
        JSON.stringify(firstReq, null, 2)
      );
      console.log("[/api/requests/list] Requester:", firstReq.requester);
      console.log("[/api/requests/list] Head approver:", firstReq.head_approver);
    }

    // Now fetch related data separately to avoid RLS filtering issues
    if (data && data.length > 0) {
      const requesterIds = [...new Set(data.map((r: any) => r.requester_id).filter(Boolean))];
      const departmentIds = [...new Set(data.map((r: any) => r.department_id).filter(Boolean))];
      const approverIds = [
        ...new Set([
          ...data.map((r: any) => r.head_approved_by).filter(Boolean),
          ...data.map((r: any) => r.admin_approved_by).filter(Boolean),
        ])
      ];
      const preferredDriverIds = [...new Set(data.map((r: any) => r.preferred_driver_id).filter(Boolean))];
      const preferredVehicleIds = [...new Set(data.map((r: any) => r.preferred_vehicle_id).filter(Boolean))];

      // Fetch all related data in parallel using service role client
      const [requesters, departments, approvers, preferredDrivers, preferredVehicles] = await Promise.all([
        requesterIds.length > 0
          ? supabaseServiceRole.from("users").select("id, email, name").in("id", requesterIds)
          : Promise.resolve({ data: [], error: null }),
        departmentIds.length > 0
          ? supabaseServiceRole.from("departments").select("id, name, code").in("id", departmentIds)
          : Promise.resolve({ data: [], error: null }),
        approverIds.length > 0
          ? supabaseServiceRole.from("users").select("id, email, name").in("id", approverIds)
          : Promise.resolve({ data: [], error: null }),
        preferredDriverIds.length > 0
          ? supabaseServiceRole.from("users").select("id, email, name").in("id", preferredDriverIds)
          : Promise.resolve({ data: [], error: null }),
        preferredVehicleIds.length > 0
          ? supabaseServiceRole.from("vehicles").select("id, vehicle_name, plate_number, type").in("id", preferredVehicleIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Create lookup maps
      const requesterMap = new Map((requesters.data || []).map((u: any) => [u.id, u]));
      const departmentMap = new Map((departments.data || []).map((d: any) => [d.id, d]));
      const approverMap = new Map((approvers.data || []).map((u: any) => [u.id, u]));
      const preferredDriverMap = new Map((preferredDrivers.data || []).map((u: any) => [u.id, u]));
      const preferredVehicleMap = new Map((preferredVehicles.data || []).map((v: any) => [v.id, v]));

      // Attach related data to requests
      data.forEach((req: any) => {
        req.requester = req.requester_id ? requesterMap.get(req.requester_id) : null;
        req.department = req.department_id ? departmentMap.get(req.department_id) : null;
        req.head_approver = req.head_approved_by ? approverMap.get(req.head_approved_by) : null;
        req.admin_approver = req.admin_approved_by ? approverMap.get(req.admin_approved_by) : null;
        req.preferred_driver = req.preferred_driver_id ? preferredDriverMap.get(req.preferred_driver_id) : null;
        req.preferred_vehicle = req.preferred_vehicle_id ? preferredVehicleMap.get(req.preferred_vehicle_id) : null;
        
        // Parse expense_breakdown if it's a string (JSONB from database)
        if (req.expense_breakdown && typeof req.expense_breakdown === 'string') {
          try {
            req.expense_breakdown = JSON.parse(req.expense_breakdown);
          } catch (e) {
            console.warn(`[API /requests/list] Failed to parse expense_breakdown for request ${req.id}:`, e);
          }
        }
        
        // Add preferred names as flat fields for easier access
        if (req.preferred_driver) {
          req.preferred_driver_name = req.preferred_driver.name;
        }
        if (req.preferred_vehicle) {
          req.preferred_vehicle_name = `${req.preferred_vehicle.vehicle_name} • ${req.preferred_vehicle.plate_number}`;
        }
      });
    }

    // Log sample data for debugging
    if (data && data.length > 0) {
      const firstReq = data[0] as any;
      console.log("📊 Sample request data from DB:");
      console.log("  - ID:", firstReq.id);
      console.log("  - Status:", firstReq.status);
      console.log("  - Requester:", firstReq.requester?.name || firstReq.requester?.email);
      console.log("  - Head:", firstReq.head_approver?.name || firstReq.head_approver?.email);
      console.log("  - Total budget:", firstReq.total_budget);
      console.log("  - Comptroller edited budget:", firstReq.comptroller_edited_budget);
      console.log("  - Expense breakdown items:", firstReq.expense_breakdown?.length || 0);
    }

    // Return just the data array with cache headers
    const response = NextResponse.json(data || []);
    // Performance: Cache for 10 seconds, allow stale for 30 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return response;
    
  } catch (error: any) {
    console.error("[/api/requests/list] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
