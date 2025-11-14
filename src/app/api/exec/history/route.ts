import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/exec/history
 * Fetch requests that Executive has approved or rejected
 * Includes VP, President, and Exec approvals
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get authenticated user to check their role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check roles
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_vp, is_president, is_exec")
      .eq("auth_user_id", user.id)
      .single();

    // Build query based on user role
    let query = supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name, position_title, profile_picture),
        department:departments!requests_department_id_fkey(id, name, code),
        submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name, position_title, profile_picture),
        head_approver:users!requests_head_approved_by_fkey(id, email, name),
        admin_approver:users!requests_admin_processed_by_fkey(id, email, name),
        comptroller_approver:users!requests_comptroller_approved_by_fkey(id, email, name),
        hr_approver:users!requests_hr_approved_by_fkey(id, email, name),
        vp_approver:users!requests_vp_approved_by_fkey(id, email, name),
        president_approver:users!requests_president_approved_by_fkey(id, email, name),
        exec_approver:users!requests_exec_approved_by_fkey(id, email, name)
      `)
      .in("status", ["approved", "rejected"]);

    // Filter by approval based on role
    if (profile?.is_president) {
      query = query.not("president_approved_at", "is", null);
      query = query.order("president_approved_at", { ascending: false });
    } else if (profile?.is_vp) {
      query = query.not("vp_approved_at", "is", null);
      query = query.order("vp_approved_at", { ascending: false });
    } else if (profile?.is_exec) {
      query = query.not("exec_approved_at", "is", null);
      query = query.order("exec_approved_at", { ascending: false });
    } else {
      // Default: show any exec-level approval
      query = query.or("exec_approved_at.not.is.null,vp_approved_at.not.is.null,president_approved_at.not.is.null");
      query = query.order("updated_at", { ascending: false });
    }

    query = query.limit(100);

    const { data, error } = await query;

    if (error) {
      console.error("Exec history fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[Exec History API] Total requests:", data?.length);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err) {
    console.error("Exec history error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Executive history" },
      { status: 500 }
    );
  }
}
