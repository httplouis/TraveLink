import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/vp/inbox/count
 * Lightweight count-only endpoint for badge polling (reduces egress)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check VP status
    const { data: profile } = await supabase
      .from("users")
      .select("is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_vp) {
      return NextResponse.json({ ok: true, pending_count: 0 });
    }

    // Count pending requests for VP
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_vp");

    if (error) {
      console.error("VP inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pending_count: count || 0 });
  } catch (err: any) {
    console.error("VP inbox count error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

