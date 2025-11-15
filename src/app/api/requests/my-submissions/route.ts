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
    // 1. Requests where user submitted (submitted_by_user_id = profile.id) - ALWAYS include these
    // 2. Requests where user is the requester AND they've signed it (for representative submissions)
    //    This ensures representative submissions only appear for requester AFTER they sign
    
    // Query 1: Requests submitted by this user
    const { data: submittedRequests, error: submittedError } = await supabase
      .from("requests")
      .select(`
        *,
        department:departments!department_id(id, code, name)
      `)
      .eq("submitted_by_user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (submittedError) {
      console.error("[GET /api/requests/my-submissions] Submitted requests error:", submittedError);
      return NextResponse.json({ ok: false, error: submittedError.message }, { status: 500 });
    }

    // Query 2: Requests where user is requester AND has signed (representative submissions)
    const { data: signedRequests, error: signedError } = await supabase
      .from("requests")
      .select(`
        *,
        department:departments!department_id(id, code, name)
      `)
      .eq("requester_id", profile.id)
      .not("requester_signature", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (signedError) {
      console.error("[GET /api/requests/my-submissions] Signed requests error:", signedError);
      return NextResponse.json({ ok: false, error: signedError.message }, { status: 500 });
    }

    // Combine and deduplicate by ID (in case a request matches both conditions)
    const allRequests = [...(submittedRequests || []), ...(signedRequests || [])];
    const uniqueRequests = Array.from(
      new Map(allRequests.map((r: any) => [r.id, r])).values()
    );

    // Sort by created_at descending
    uniqueRequests.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ ok: true, data: uniqueRequests.slice(0, 100) });
  } catch (err: any) {
    console.error("[GET /api/requests/my-submissions] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
