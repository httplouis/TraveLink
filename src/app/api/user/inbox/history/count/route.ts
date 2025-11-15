// src/app/api/user/inbox/history/count/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/inbox/history/count
 * Get count of signed requests for the logged-in user
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
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const userId = profile.id;

    // Count signed requests (same logic as history API)
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`requester_id.eq.${userId},submitted_by_user_id.eq.${userId}`)
      .not("requester_signature", "is", null)
      .not("status", "eq", "pending_requester_signature");

    if (error) {
      console.error("[GET /api/user/inbox/history/count] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      count: count || 0,
    });
  } catch (err: any) {
    console.error("[GET /api/user/inbox/history/count] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

