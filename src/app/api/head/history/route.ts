// src/app/api/head/history/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/head/history  → list all requests that this head has approved/rejected
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[GET /api/head/history] Profile error:", profileError);
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    if (!profile.is_head) {
      console.log("[GET /api/head/history] User is not a head, returning empty list");
      return NextResponse.json({ ok: true, data: [] });
    }

    if (!profile.department_id) {
      console.log("[GET /api/head/history] Head has no department_id, returning empty list");
      return NextResponse.json({ ok: true, data: [] });
    }

    console.log(`[GET /api/head/history] Fetching history for head: ${profile.email}, dept: ${profile.department_id}`);

    // Get requests where this head has already approved or rejected
    // Include: approved (has head_approved_by) OR rejected status
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email),
        department:departments!department_id(id, name, code)
      `)
      .eq("department_id", profile.department_id)
      .or(`head_approved_by.eq.${profile.id},parent_head_approved_by.eq.${profile.id},status.eq.rejected`)
      .not("status", "in", '("pending_head","pending_parent_head")')
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    
    console.log(`[GET /api/head/history] Query filters:`, {
      department_id: profile.department_id,
      head_id: profile.id,
      checking: "head_approved_by OR parent_head_approved_by",
      result_count: data?.length || 0
    });

    if (error) {
      console.error("[GET /api/head/history] Query error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[GET /api/head/history] Found ${data?.length || 0} history items`);
    
    // Debug: Check ALL requests in this department to see what's there
    const { data: allDeptRequests } = await supabase
      .from("requests")
      .select("id, status, head_approved_by, parent_head_approved_by, department_id")
      .eq("department_id", profile.department_id)
      .limit(5);
    console.log(`[GET /api/head/history] Sample of ALL dept requests:`, allDeptRequests);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[GET /api/head/history] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
