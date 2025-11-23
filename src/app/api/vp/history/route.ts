import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS completely)
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

    // Get VP user profile
    const { data: vpUser, error: profileError } = await supabase
      .from("users")
      .select("id, is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !vpUser?.is_vp) {
      return NextResponse.json({ ok: false, error: "VP role required" }, { status: 403 });
    }

    console.log(`[VP History] Fetching history for VP ${vpUser.id}`);

    // Get all requests approved or rejected by this VP
    // Split into two queries and merge results
    const [approvedResult, rejectedResult] = await Promise.all([
      // Approved by VP
      supabase
        .from("requests")
        .select("*")
        .eq("vp_approved_by", vpUser.id)
        .order("updated_at", { ascending: false })
        .limit(50),
      // Rejected by VP
      supabase
        .from("requests")
        .select("*")
        .eq("rejected_by", vpUser.id)
        .eq("rejection_stage", "vp")
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);

    if (approvedResult.error) {
      console.error("[VP History] Error fetching approved requests:", approvedResult.error);
      return NextResponse.json({ ok: false, error: approvedResult.error.message }, { status: 500 });
    }

    if (rejectedResult.error) {
      console.error("[VP History] Error fetching rejected requests:", rejectedResult.error);
      return NextResponse.json({ ok: false, error: rejectedResult.error.message }, { status: 500 });
    }

    // Merge and sort by updated_at
    const requests = [...(approvedResult.data || []), ...(rejectedResult.data || [])]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 50);

    console.log(`[VP History] Found ${requests?.length || 0} requests`);

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
    console.error("[VP History] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
