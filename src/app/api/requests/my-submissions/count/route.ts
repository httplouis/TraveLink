// Count user's pending submissions only (for badge polling)
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Get authenticated user first (for authorization) - use anon key to read cookies
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get user profile
    const { data: profiles, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .limit(1);

    if (profileError) {
      console.error("[GET /api/requests/my-submissions/count] Profile error:", profileError);
      return NextResponse.json({ ok: false, error: "Profile not found: " + profileError.message }, { status: 404 });
    }

    const profile = profiles?.[0];
    if (!profile) {
      console.error("[GET /api/requests/my-submissions/count] No profile returned");
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    console.log("[GET /api/requests/my-submissions/count] Profile ID:", profile.id);

    // Count submissions based on:
    // 1. Requests submitted BY this user (submitted_by_user_id = profile.id) - ALWAYS count these
    // 2. Requests where user is the requester AND they've signed it (for representative submissions)
    //    This ensures representative submissions only count for requester AFTER they sign
    
    // Query 1: Requests submitted by this user
    const { data: submittedRequests, error: submittedError } = await supabase
      .from("requests")
      .select("id, status")
      .eq("submitted_by_user_id", profile.id);

    if (submittedError) {
      console.error("[GET /api/requests/my-submissions/count] Submitted requests query error:", submittedError);
      return NextResponse.json({ ok: false, error: "Database error: " + (submittedError.message || JSON.stringify(submittedError)) }, { status: 500 });
    }

    // Query 2: Requests where user is requester AND has signed (representative submissions)
    const { data: signedRequests, error: signedError } = await supabase
      .from("requests")
      .select("id, status")
      .eq("requester_id", profile.id)
      .not("requester_signature", "is", null);

    if (signedError) {
      console.error("[GET /api/requests/my-submissions/count] Signed requests query error:", signedError);
      return NextResponse.json({ ok: false, error: "Database error: " + (signedError.message || JSON.stringify(signedError)) }, { status: 500 });
    }

    // Combine and deduplicate by ID (in case a request matches both conditions)
    const allRequests = [...(submittedRequests || []), ...(signedRequests || [])];
    const uniqueRequests = Array.from(
      new Map(allRequests.map((r: any) => [r.id, r])).values()
    );

    console.log("[GET /api/requests/my-submissions/count] Total unique requests found:", uniqueRequests.length);

    // Filter out completed statuses
    const pendingCount = uniqueRequests.filter((r: any) => {
      const status = r.status;
      return status !== 'approved' && status !== 'rejected' && status !== 'cancelled';
    }).length;

    console.log("[GET /api/requests/my-submissions/count] Pending count:", pendingCount);

    return NextResponse.json({ ok: true, pending_count: pendingCount });
  } catch (err: any) {
    console.error("[GET /api/requests/my-submissions/count] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
