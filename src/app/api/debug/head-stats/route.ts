// Debug endpoint for head stats
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing environment variables",
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }
    
    // Use service role client
    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Use regular client for auth
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        ok: false, 
        error: "Unauthorized",
        authError: authError?.message 
      }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        ok: false, 
        error: "Profile not found",
        profileError: profileError?.message,
        auth_user_id: user.id
      }, { status: 404 });
    }

    // Get department info
    let department = null;
    if (profile.department_id) {
      const { data: deptData } = await supabaseServiceRole
        .from("departments")
        .select("*")
        .eq("id", profile.department_id)
        .single();
      department = deptData;
    }

    // Count requests in different statuses for this department
    let requestCounts: any = {};
    if (profile.department_id) {
      const statuses = ['draft', 'pending_head', 'pending_parent_head', 'pending_admin', 'pending_comptroller', 'pending_exec', 'approved', 'rejected', 'cancelled'];
      
      for (const status of statuses) {
        const { count } = await supabaseServiceRole
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("department_id", profile.department_id)
          .eq("status", status);
        requestCounts[status] = count || 0;
      }
      
      // Total requests for department
      const { count: totalDept } = await supabaseServiceRole
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("department_id", profile.department_id);
      requestCounts.total_department = totalDept || 0;
    }

    // Count all requests in the system
    const { count: totalRequests } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true });

    // Get sample requests for this department
    let sampleRequests: any[] = [];
    if (profile.department_id) {
      const { data: samples } = await supabaseServiceRole
        .from("requests")
        .select("id, request_number, status, department_id, requester_id, created_at")
        .eq("department_id", profile.department_id)
        .limit(5);
      sampleRequests = samples || [];
    }

    return NextResponse.json({
      ok: true,
      debug: {
        auth_user_id: user.id,
        auth_email: user.email,
        profile: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          is_head: profile.is_head,
          is_admin: profile.is_admin,
          is_vp: profile.is_vp,
          is_president: profile.is_president,
          is_comptroller: profile.is_comptroller,
          is_hr: profile.is_hr,
          department_id: profile.department_id,
          department: profile.department,
          exec_type: profile.exec_type
        },
        department: department,
        requestCounts: requestCounts,
        totalRequestsInSystem: totalRequests || 0,
        sampleRequests: sampleRequests,
        headStatsWouldReturn: {
          isHead: profile.is_head,
          hasDepartmentId: !!profile.department_id,
          wouldReturnZeros: !profile.is_head || !profile.department_id
        }
      }
    });
  } catch (err: any) {
    console.error("[DEBUG /api/debug/head-stats] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
