// src/app/api/requests/[id]/next-approvers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/requests/[id]/next-approvers
 * Get the next approvers who will receive this request after signing
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;

    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[GET /api/requests/[id]/next-approvers] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
    }

    // Get authenticated user first (for authorization)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

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
    
    // Service role client for queries (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get user profile using service role
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select(`
        id,
        status,
        department_id,
        requester_id,
        has_budget,
        needs_vehicle,
        vehicle_mode
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Fetch department separately
    let department: any = null;
    if (request.department_id) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name, code, parent_department_id")
        .eq("id", request.department_id)
        .maybeSingle();
      
      if (deptData) {
        department = deptData;
      }
    }

    // Verify user can sign this request
    const isRequester = request.requester_id === profile.id;
    const { data: requestWithSubmitter } = await supabase
      .from("requests")
      .select("submitted_by_user_id")
      .eq("id", requestId)
      .single();
    
    const isSubmitter = requestWithSubmitter?.submitted_by_user_id === profile.id;
    
    if (!isRequester && !isSubmitter) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    // Determine next approvers based on current status
    // After signing, it goes to "pending_head" status
    const nextStatus = "pending_head";
    const approvers: any[] = [];

    // Get department heads for the request's department
    if (request.department_id) {
      // Check if there's a parent department (for parent routing)
      const targetDepartmentId = department?.parent_department_id || request.department_id;
      
      console.log("[GET /api/requests/[id]/next-approvers] Looking for heads:", {
        requestDepartmentId: request.department_id,
        targetDepartmentId,
        hasParent: !!department?.parent_department_id,
      });
      
      // Try direct SQL query as fallback if Supabase query fails
      // First try Supabase query
      let { data: heads, error: headsError } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          position_title,
          department_id,
          is_head,
          status
        `)
        .eq("department_id", targetDepartmentId)
        .eq("is_head", true);

      console.log("[GET /api/requests/[id]/next-approvers] Heads query (without status filter):", {
        headsFound: heads?.length || 0,
        headsError: headsError?.message,
        targetDepartmentId,
        heads: heads?.map((h: any) => ({ 
          id: h.id, 
          name: h.name, 
          dept_id: h.department_id,
          is_head: h.is_head,
          status: h.status
        })),
      });

      // If no heads found, query all users in department to debug and use as fallback
      if ((!heads || heads.length === 0) && !headsError) {
        console.log("[GET /api/requests/[id]/next-approvers] No heads found via direct query, trying fallback...");
        
        // Query all users in this department to see what we have
        // Use service role client to bypass RLS
        const { data: allUsers, error: allUsersError } = await supabase
          .from("users")
          .select("id, name, email, position_title, department_id, is_head, status, role")
          .eq("department_id", targetDepartmentId)
          .limit(100); // Add limit to ensure we get all results
        
        console.log("[GET /api/requests/[id]/next-approvers] All users in department:", {
          total: allUsers?.length || 0,
          targetDepartmentId,
          error: allUsersError?.message,
          users: allUsers?.map((u: any) => ({ 
            name: u.name, 
            is_head: u.is_head,
            is_head_type: typeof u.is_head,
            status: u.status,
            role: u.role,
            department_id: u.department_id
          }))
        });

        // Try to find heads manually from the results
        // Check both boolean true and string "true" for is_head
        if (allUsers && !allUsersError) {
          const foundHeads = allUsers.filter((u: any) => {
            const isHead = u.is_head === true || u.is_head === "true" || u.is_head === 1;
            const isActive = u.status === "active" || u.status === "Active";
            console.log(`[GET /api/requests/[id]/next-approvers] Checking user ${u.name}: is_head=${u.is_head} (${typeof u.is_head}), status=${u.status}, matches=${isHead && isActive}`);
            return isHead && isActive;
          });
          
          console.log("[GET /api/requests/[id]/next-approvers] Found heads via fallback filter:", {
            count: foundHeads.length,
            heads: foundHeads.map((h: any) => ({ name: h.name, is_head: h.is_head, status: h.status }))
          });
          
          if (foundHeads.length > 0) {
            heads = foundHeads.map((h: any) => ({
              id: h.id,
              name: h.name,
              email: h.email,
              position_title: h.position_title,
              department_id: h.department_id,
              is_head: h.is_head,
              status: h.status
            }));
            console.log("[GET /api/requests/[id]/next-approvers] Successfully set heads from fallback:", heads.length);
          } else {
            console.log("[GET /api/requests/[id]/next-approvers] No heads found even in fallback query");
          }
        } else {
          console.log("[GET /api/requests/[id]/next-approvers] Error querying all users:", allUsersError?.message);
        }
      }

      // Filter by status in JavaScript if needed
      if (heads && heads.length > 0) {
        const beforeFilter = heads.length;
        heads = heads.filter((h: any) => h.status === "active");
        console.log("[GET /api/requests/[id]/next-approvers] After status filter:", {
          beforeFilter,
          afterFilter: heads.length,
        });
      }

      // Fetch department info separately for each head
      if (!headsError && heads && heads.length > 0) {
        const headDepartmentIds = [...new Set(heads.map((h: any) => h.department_id).filter(Boolean))];
        let departmentsMap: Record<string, any> = {};
        
        if (headDepartmentIds.length > 0) {
          const { data: deptData } = await supabase
            .from("departments")
            .select("id, name, code")
            .in("id", headDepartmentIds);
          
          if (deptData) {
            departmentsMap = deptData.reduce((acc, dept) => {
              acc[dept.id] = dept;
              return acc;
            }, {} as Record<string, any>);
          }
        }

        approvers.push(...heads.map((head: any) => {
          const headDept = departmentsMap[head.department_id];
          return {
            id: head.id,
            name: head.name,
            email: head.email,
            role: "head",
            roleLabel: "Department Head",
            department: headDept?.name || department?.name,
            departmentCode: headDept?.code || department?.code,
            position: head.position_title || "Department Head",
          };
        }));
      }
    }

    // If no heads found, return empty array (will show message in UI)
    return NextResponse.json({
      ok: true,
      data: {
        nextStatus,
        nextStatusLabel: "Department Head",
        approvers,
        message: approvers.length === 0 
          ? "No department head found for this department. Please contact your administrator."
          : approvers.length === 1
          ? `This request will be sent to ${approvers[0].name} (${approvers[0].roleLabel})`
          : `This request will be sent to one of the following department heads:`,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]/next-approvers] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

