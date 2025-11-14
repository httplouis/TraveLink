import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/inbox
 * Fetch requests awaiting requester signature (representative submissions)
 * These are requests where someone submitted on behalf of the current user
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
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

    console.log(`[User Inbox] Fetching requests for user: ${profile.name} (${profile.id})`);

    // Get requests where:
    // 1. requester_id matches current user (they are the requesting person)
    // 2. status is "pending_requester_signature" (needs their signature)
    // 3. is_representative is true (someone submitted on their behalf)
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name, department_id),
        submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code),
        preferred_driver:users!preferred_driver_id(id, name, email),
        preferred_vehicle:vehicles!preferred_vehicle_id(id, vehicle_name, plate_number, type)
      `)
      .eq("requester_id", profile.id)
      .eq("status", "pending_requester_signature")
      .eq("is_representative", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[User Inbox] Query error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[User Inbox] Found ${data?.length || 0} pending signature requests`);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[User Inbox] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

