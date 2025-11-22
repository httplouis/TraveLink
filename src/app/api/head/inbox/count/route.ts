import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/head/inbox/count
 * Lightweight count-only endpoint for badge polling (reduces egress)
 */
export async function GET() {
  try {
    // Get authenticated user first (for authorization) - use anon key to read cookies
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS)
    const supabase = await createSupabaseServerClient(true);

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, department_id, is_head")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_head || !profile.department_id) {
      return NextResponse.json({ ok: true, pending_count: 0 });
    }

    // Count pending requests for this department
    // IMPORTANT: Exclude requests where requester is the current head (they shouldn't see their own requests)
    // Also count requests from child departments (for parent heads like SVP)
    
    // Count 1: Direct department requests
    const { count: directCount, error: directError } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending_head", "pending_parent_head"])
      .eq("department_id", profile.department_id)
      .neq("requester_id", profile.id);
    
    // Count 2: Child department requests (for parent heads)
    let childCount = 0;
    try {
      const { data: childDepartments } = await supabase
        .from("departments")
        .select("id")
        .eq("parent_department_id", profile.department_id);
      
      if (childDepartments && childDepartments.length > 0) {
        const childDeptIds = childDepartments.map((d: any) => d.id);
        const { count: childDeptCount } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending_parent_head"])
          .in("department_id", childDeptIds)
          .neq("requester_id", profile.id);
        
        childCount = childDeptCount || 0;
      }
    } catch (err) {
      console.error("[Head Inbox Count] Error counting child department requests:", err);
    }
    
    const count = (directCount || 0) + childCount;
    const error = directError;

    if (error) {
      console.error("Head inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pending_count: count || 0 });
  } catch (err: any) {
    console.error("Head inbox count error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
