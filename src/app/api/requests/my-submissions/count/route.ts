// Count user's pending submissions only (for badge polling)
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
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error("[GET /api/requests/my-submissions/count] Profile error:", profileError);
      return NextResponse.json({ ok: false, error: "Profile not found: " + profileError.message }, { status: 404 });
    }

    if (!profile) {
      console.error("[GET /api/requests/my-submissions/count] No profile returned");
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    console.log("[GET /api/requests/my-submissions/count] Profile ID:", profile.id);

    // Count only pending submissions (lightweight query)
    const { data, error } = await supabase
      .from("requests")
      .select("id, status")
      .eq("requester_id", profile.id);

    if (error) {
      console.error("[GET /api/requests/my-submissions/count] Query error:", error);
      return NextResponse.json({ ok: false, error: "Database error: " + (error.message || JSON.stringify(error)) }, { status: 500 });
    }

    console.log("[GET /api/requests/my-submissions/count] Total requests found:", data?.length || 0);

    // Filter out completed statuses
    const pendingCount = data?.filter((r: any) => {
      const status = r.status;
      return status !== 'approved' && status !== 'rejected' && status !== 'cancelled';
    })?.length || 0;

    console.log("[GET /api/requests/my-submissions/count] Pending count:", pendingCount);

    return NextResponse.json({ ok: true, pending_count: pendingCount });
  } catch (err: any) {
    console.error("[GET /api/requests/my-submissions/count] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
