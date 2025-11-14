import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/inbox/history
 * Fetch requests that user has signed (requester signature provided)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    console.log(`[User Inbox History] Fetching signed requests for user: ${profile.name} (${profile.id})`);

    // Get requests where:
    // 1. requester_id matches current user
    // 2. requester_signature is NOT null (they've signed it)
    // 3. is_representative is true (someone submitted on their behalf)
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name, department_id),
        submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code)
      `)
      .eq("requester_id", profile.id)
      .not("requester_signature", "is", null)
      .eq("is_representative", true)
      .order("requester_signed_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[User Inbox History] Query error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[User Inbox History] Found ${data?.length || 0} signed requests`);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[User Inbox History] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

