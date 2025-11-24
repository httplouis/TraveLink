import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering (API routes should always be dynamic)
export const dynamic = 'force-dynamic';
// Performance: Cache count for 10 seconds (frequently polled)
export const revalidate = 10;

/**
 * GET /api/user/inbox/count
 * Lightweight count-only endpoint for badge polling
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: true, pending_count: 0 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: true, pending_count: 0 });
    }

    // Count pending signature requests
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", profile.id)
      .eq("status", "pending_requester_signature")
      .eq("is_representative", true);

    if (error) {
      console.error("User inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true, pending_count: count || 0 });
    // Performance: Cache count for 10 seconds
    response.headers.set('Cache-Control', 'private, s-maxage=10, stale-while-revalidate=30');
    return response;
  } catch (err: any) {
    console.error("User inbox count error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

