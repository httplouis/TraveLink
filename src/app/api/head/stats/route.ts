import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering (uses cookies - must be dynamic)
export const dynamic = 'force-dynamic';
// Note: Use Cache-Control headers for runtime caching (revalidate doesn't work with force-dynamic)

export async function GET() {
  try {
    // Verify environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[GET /api/head/stats] Missing environment variables:", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json({ 
        ok: false, 
        error: "Server configuration error" 
      }, { status: 500 });
    }
    
    // Use service role client to bypass RLS for stats queries
    const supabaseServiceRole = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Use regular client for auth check only
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with department_id
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[GET /api/head/stats] Profile error:", profileError);
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    if (!profile.is_head || !profile.department_id) {
      return NextResponse.json({
        ok: true,
        data: {
          pendingEndorsements: 0,
          activeRequests: 0,
          departmentRequests: 0
        }
      });
    }

    const userId = profile.id;
    const departmentId = profile.department_id;

    // 1. Pending Endorsements: Requests in pending_head or pending_parent_head status for this head's department
    // Also count requests from child departments (for parent heads like SVP)
    // Use service role client to bypass RLS
    const { count: directPending, error: directPendingError } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending_head", "pending_parent_head"])
      .eq("department_id", departmentId);
    
    // Count child department requests (for parent heads)
    let childPendingCount = 0;
    try {
      const { data: childDepartments } = await supabaseServiceRole
        .from("departments")
        .select("id")
        .eq("parent_department_id", departmentId);
      
      if (childDepartments && childDepartments.length > 0) {
        const childDeptIds = childDepartments.map((d: any) => d.id);
        const { count: childCount } = await supabaseServiceRole
          .from("requests")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending_parent_head"])
          .in("department_id", childDeptIds);
        
        childPendingCount = childCount || 0;
      }
    } catch (err) {
      console.error("[GET /api/head/stats] Error counting child department requests:", err);
    }
    
    const pendingEndorsements = (directPending || 0) + childPendingCount;
    const pendingError = directPendingError;

    if (pendingError) {
      console.error("[GET /api/head/stats] Pending endorsements error:", pendingError);
    }

    // 2. Active Requests: Requests submitted by or requested by this user, not in final states
    // Use service role client to bypass RLS
    const { count: activeRequests, error: activeError } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(approved,rejected,cancelled)");

    if (activeError) {
      console.error("[GET /api/head/stats] Active requests error:", activeError);
    }

    // 3. My Department: All requests from this head's department (any status except cancelled)
    // Use service role client to bypass RLS
    const { count: departmentRequests, error: deptError } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("department_id", departmentId)
      .neq("status", "cancelled");

    if (deptError) {
      console.error("[GET /api/head/stats] Department requests error:", deptError);
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        pendingEndorsements: pendingEndorsements || 0,
        activeRequests: activeRequests || 0,
        departmentRequests: departmentRequests || 0
      }
    });
    // Performance: Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (err: any) {
    console.error("[GET /api/head/stats] Unexpected error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message || "Failed to fetch stats" 
    }, { status: 500 });
  }
}
