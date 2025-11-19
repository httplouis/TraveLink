import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Use service_role to bypass RLS for admin operations
    const supabase = await createSupabaseServerClient(true);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get President user profile
    const { data: presidentUser, error: profileError } = await supabase
      .from("users")
      .select("id, is_president")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !presidentUser?.is_president) {
      return NextResponse.json({ ok: false, error: "President role required" }, { status: 403 });
    }

    console.log(`[President History] Fetching history for President ${presidentUser.id}`);

    // Get all requests approved or rejected by this President
    // Split into two queries and merge results
    const [approvedResult, rejectedResult] = await Promise.all([
      // Approved by President
      supabase
        .from("requests")
        .select("*")
        .eq("president_approved_by", presidentUser.id)
        .order("updated_at", { ascending: false })
        .limit(50),
      // Rejected by President
      supabase
        .from("requests")
        .select("*")
        .eq("rejected_by", presidentUser.id)
        .eq("rejection_stage", "president")
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);

    if (approvedResult.error) {
      console.error("[President History] Error fetching approved requests:", approvedResult.error);
      return NextResponse.json({ ok: false, error: approvedResult.error.message }, { status: 500 });
    }

    if (rejectedResult.error) {
      console.error("[President History] Error fetching rejected requests:", rejectedResult.error);
      return NextResponse.json({ ok: false, error: rejectedResult.error.message }, { status: 500 });
    }

    // Merge and sort by updated_at
    const requests = [...(approvedResult.data || []), ...(rejectedResult.data || [])]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 50);

    console.log(`[President History] Found ${requests?.length || 0} requests`);

    if (!requests || requests.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    // Enrich with requester and department data
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        // Get requester info
        const { data: requester } = await supabase
          .from("users")
          .select("name, position_title, profile_picture")
          .eq("id", req.requester_id)
          .single();

        // Get department info
        const { data: department } = await supabase
          .from("departments")
          .select("name, code")
          .eq("id", req.department_id)
          .single();

        return {
          ...req,
          requester,
          department,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: enrichedRequests,
    });

  } catch (error) {
    console.error("[President History] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
