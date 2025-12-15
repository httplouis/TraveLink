import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/exec/inbox
 * Fetch requests awaiting Executive final approval
 * Handles both workflows:
 * - Old: pending_exec (direct from HR)
 * - New: pending_vp (VP approval needed) or pending_president (President approval needed)
 */
export async function GET() {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    // Use service role for database operations
    const supabase = await createSupabaseServerClient(true);
    
    // Get authenticated user to check their role
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check roles
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_vp, is_president, is_exec")
      .eq("auth_user_id", user.id)
      .single();

    // Determine which statuses to fetch based on user role
    let statusFilter: string[] = [];
    if (profile?.is_president) {
      // President sees pending_president requests
      statusFilter = ["pending_president"];
    } else if (profile?.is_vp) {
      // VP sees pending_vp requests
      statusFilter = ["pending_vp"];
    } else if (profile?.is_exec) {
      // Exec sees pending_exec requests (old workflow)
      statusFilter = ["pending_exec"];
    } else {
      // Default: show all executive-level statuses
      statusFilter = ["pending_vp", "pending_president", "pending_exec"];
    }

    console.log("[Exec Inbox API] User role:", { is_vp: profile?.is_vp, is_president: profile?.is_president, is_exec: profile?.is_exec });
    console.log("[Exec Inbox API] Fetching statuses:", statusFilter);
    
    const { data, error} = await supabase
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
      .in("status", statusFilter)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Exec inbox fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[Exec Inbox API] Total requests:", data?.length);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err) {
    console.error("Exec inbox error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Executive inbox" },
      { status: 500 }
    );
  }
}
