import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/head/inbox/count
 * Lightweight count-only endpoint for badge polling (reduces egress)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

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
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending_head", "pending_parent_head"])
      .eq("department_id", profile.department_id);

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
