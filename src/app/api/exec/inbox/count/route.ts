import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/exec/inbox/count
 * Count requests awaiting Executive approval
 * Handles both workflows: pending_vp, pending_president, pending_exec
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

    // Determine which statuses to count based on user role
    let statusFilter: string[] = [];
    if (profile?.is_president) {
      statusFilter = ["pending_president"];
    } else if (profile?.is_vp) {
      statusFilter = ["pending_vp"];
    } else if (profile?.is_exec) {
      statusFilter = ["pending_exec"];
    } else {
      // Default: count all executive-level statuses
      statusFilter = ["pending_vp", "pending_president", "pending_exec"];
    }
    
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .in("status", statusFilter);

    if (error) {
      console.error("Exec inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pending_count: count || 0 });
  } catch (err) {
    console.error("Exec inbox count error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch count" },
      { status: 500 }
    );
  }
}
