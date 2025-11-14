// Get user's submitted requests with history
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Get all requests submitted by this user (either as requester OR as submitter)
    // This includes:
    // 1. Requests where user is the requester (requester_id = profile.id)
    // 2. Requests where user submitted on behalf of someone else (submitted_by_user_id = profile.id)
    const { data: requests, error } = await supabase
      .from("requests")
      .select(`
        *,
        department:departments!department_id(id, code, name)
      `)
      .or(`requester_id.eq.${profile.id},submitted_by_user_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(100); // Limit to 100 most recent submissions

    if (error) {
      console.error("[GET /api/requests/my-submissions] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: requests || [] });
  } catch (err: any) {
    console.error("[GET /api/requests/my-submissions] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
